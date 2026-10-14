import { randomUUID } from "expo-crypto";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "@/context/auth";
import type { Json, Tables } from "@/lib/database.types";
import { PHOTO_LINK_SECONDS, photoLink } from "@/lib/photos";
import { supabase } from "@/lib/supabase";
import { formatPhone, toE164 } from "@/utils/phone";

/**
 * Holds everything the caregiver enters during setup (steps 1–3) and later,
 * so every screen can read and update the same answers.
 *
 * Signed out (onboarding): answers live only in memory.
 * Signed in: answers are loaded from Supabase, and every change is saved
 * automatically about half a second later (see "Auto-save" below).
 */

export type CheckInMethod = "text" | "call" | "app";

export const PRIMARY_PERSON_ID = "primary";

export type Backup = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  alertAfter: number; // minutes after the person before them was alerted
};

/** Someone added later from the home screen, in addition to the person set up in steps 1–3 */
export type Person = {
  id: string;
  firstName: string;
  phone: string;
  method: CheckInMethod;
  windowStart: number; // minutes after midnight
  windowEnd: number;
  days: number[]; // 0 = Monday … 6 = Sunday
  extraMinutes: number; // wait after the window ends before alerting the caregiver
  backups: Backup[]; // in alert order, after the caregiver
  paused?: boolean;
  caregiverRelationship?: string;
  timeZone?: string; // IANA zone, e.g. "America/Indianapolis"; defaults to this phone's
};

export type CaregiverSetupData = {
  firstName: string;
  phone: string;
  yourFirstName: string;
  yourPhone: string;
  yourEmail: string;
  /** What the app shows: a temporary link to the stored photo (or "") */
  yourPhotoUri: string;
  /** Where the photo is stored (avatars bucket), or null for no photo */
  yourPhotoPath: string | null;
  caregiverRelationship: string;
  windowStart: number; // minutes after midnight
  windowEnd: number;
  days: number[]; // 0 = Monday … 6 = Sunday
  method: CheckInMethod;
  extraMinutes: number;
  backups: Backup[]; // in alert order, after the caregiver
  paused: boolean;
  /** Database id of the first person (made on the phone, so it exists before saving) */
  takerId: string;
  timeZone: string;
};

/**
 * - signedOut: onboarding, nothing is saved yet
 * - loading: reading (or, at the end of setup, first saving) from Supabase
 * - ready: loaded; changes auto-save
 * - failed: couldn't load or save the setup; `retry()` tries again
 */
export type SyncStatus = "signedOut" | "loading" | "ready" | "failed";

type CaregiverSetupContextValue = CaregiverSetupData & {
  /** Change one or more answers, e.g. update({ firstName: "Lin" }) */
  update: (changes: Partial<CaregiverSetupData>) => void;
  /** Other people the caregiver looks after (the first person lives in the fields above) */
  people: Person[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  addPerson: (person: Omit<Person, "id">) => Person;
  updatePerson: (id: string, changes: Partial<Omit<Person, "id">>) => void;
  /** Clear everything, e.g. after signing out */
  reset: () => void;
  /** The name to show in headings: "Lin", or "they" if nothing was typed yet */
  displayName: string;

  syncStatus: SyncStatus;
  /** A change couldn't be saved (it will be retried by `retry()`) */
  saveFailed: boolean;
  retry: () => void;
  /**
   * End of onboarding: call right before checking the sign-in code. Once the
   * caregiver is signed in, the setup typed so far is saved to their account
   * before anything is loaded. `cancelSetupSave()` if the code was wrong.
   */
  prepareSetupSave: () => void;
  cancelSetupSave: () => void;

  /** Invites waiting to be sent (or already sent), by taker id */
  invites: Record<string, QueuedInvite>;
  /** Ask for an invite to go to this person; the Connected screen sends it */
  queueInvite: (takerId: string, message: string) => void;
  /** Takers the database has confirmed saving (an invite needs the row first) */
  savedTakerIds: ReadonlySet<string>;
};

export type QueuedInvite = {
  /** Made once on the phone, so sending again can never text twice */
  inviteId: string;
  /** The caregiver's words; the server adds "Mira:" and "Reply YES…" */
  message: string;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const SAVE_DELAY_MS = 500;

/** This phone's time zone; used for new people until there's a picker */
function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}

function createInitial(): CaregiverSetupData {
  return {
    firstName: "",
    phone: "",
    yourFirstName: "",
    yourPhone: "",
    yourEmail: "",
    yourPhotoUri: "",
    yourPhotoPath: null,
    caregiverRelationship: "",
    windowStart: 9 * 60,
    windowEnd: 11 * 60,
    days: ALL_DAYS,
    method: "text",
    extraMinutes: 30,
    backups: [],
    paused: false,
    takerId: randomUUID(),
    timeZone: deviceTimeZone(),
  };
}

// ---------------------------------------------------------------- database ↔ app

type TakerRow = Tables<"takers"> & { backups: Tables<"backups">[] };

function backupFromRow(row: Tables<"backups">): Backup {
  return {
    id: row.id,
    name: row.name,
    phone: formatPhone(row.phone),
    relationship: row.relationship ?? "",
    alertAfter: row.alert_after_minutes,
  };
}

function personFromRow(row: TakerRow): Person {
  return {
    id: row.id,
    firstName: row.first_name,
    phone: formatPhone(row.phone),
    method: row.method,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    days: row.days,
    extraMinutes: row.extra_minutes,
    backups: [...row.backups].sort((a, b) => a.position - b.position).map(backupFromRow),
    paused: row.paused,
    caregiverRelationship: row.caregiver_relationship ?? "",
    timeZone: row.time_zone,
  };
}

/** The first person's fields, read out of the flat setup data */
function primaryAsPerson(data: CaregiverSetupData): Person {
  return {
    id: data.takerId,
    firstName: data.firstName,
    phone: data.phone,
    method: data.method,
    windowStart: data.windowStart,
    windowEnd: data.windowEnd,
    days: data.days,
    extraMinutes: data.extraMinutes,
    backups: data.backups,
    paused: data.paused,
    caregiverRelationship: data.caregiverRelationship,
    timeZone: data.timeZone,
  };
}

type JsonObject = { [key: string]: Json };
type SavePayload = { p_taker: JsonObject; p_backups: JsonObject[] };

/**
 * What `save_taker` gets for one person, or null if they can't be saved yet
 * (no name, or a phone number that isn't a full US number).
 */
function toSavePayload(p: Person): SavePayload | null {
  const phone = toE164(p.phone);
  if (!p.firstName.trim() || !phone) return null;
  const backups = p.backups.map((b) => ({ ...b, phone: toE164(b.phone) }));
  if (backups.some((b) => !b.phone || !b.name.trim())) return null;
  return {
    p_taker: {
      id: p.id,
      first_name: p.firstName.trim(),
      phone,
      caregiver_relationship: p.caregiverRelationship ?? "",
      method: p.method,
      time_zone: p.timeZone ?? deviceTimeZone(),
      window_start: p.windowStart,
      window_end: p.windowEnd,
      days: [...p.days].sort(),
      extra_minutes: p.extraMinutes,
      paused: !!p.paused,
    },
    p_backups: backups.map((b) => ({
      id: b.id,
      name: b.name.trim(),
      phone: b.phone,
      relationship: b.relationship,
      alert_after_minutes: b.alertAfter,
    })),
  };
}

function caregiverPayload(data: CaregiverSetupData) {
  return {
    first_name: data.yourFirstName.trim(),
    email: data.yourEmail.trim() || null,
  };
}

async function saveTaker(payload: SavePayload) {
  const { error } = await supabase.rpc("save_taker", payload);
  if (error) throw error;
}

async function saveCaregiver(userId: string, payload: ReturnType<typeof caregiverPayload>) {
  const { error } = await supabase.from("caregivers").update(payload).eq("id", userId);
  if (error) throw error;
}

async function loadEverything(userId: string) {
  const [caregiver, takers] = await Promise.all([
    supabase.from("caregivers").select("first_name, phone, email, photo_path").eq("id", userId).single(),
    supabase.from("takers").select("*, backups(*)").order("created_at"),
  ]);
  if (caregiver.error) throw caregiver.error;
  if (takers.error) throw takers.error;
  return { caregiver: caregiver.data, takers: takers.data as TakerRow[] };
}

// ---------------------------------------------------------------- provider

const CaregiverSetupContext = createContext<CaregiverSetupContextValue | null>(
  null,
);

export function CaregiverSetupProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [data, setData] = useState<CaregiverSetupData>(createInitial);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState(PRIMARY_PERSON_ID);

  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [invites, setInvites] = useState<Record<string, QueuedInvite>>({});
  const [savedTakerIds, setSavedTakerIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const markSaved = useCallback((id: string) => {
    setSavedTakerIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  /** JSON of what the database has, per taker id and for the caregiver */
  const saved = useRef(new Map<string, string>());
  const savedCaregiver = useRef<string | null>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  /** One save at a time per person, in order, so an older save can't land last */
  const queues = useRef(new Map<string, Promise<void>>());
  /** Latest data, for the load effect to read without re-running on every change */
  const latest = useRef({ data, people });
  /** Set by prepareSetupSave(): the onboarding answers to save once signed in */
  const pendingSetup = useRef<{ data: CaregiverSetupData } | null>(null);

  useEffect(() => {
    latest.current = { data, people };
  }, [data, people]);

  const update = useCallback((changes: Partial<CaregiverSetupData>) => {
    setData((prev) => ({ ...prev, ...changes }));
  }, []);

  const addPerson = useCallback((person: Omit<Person, "id">) => {
    const added: Person = {
      timeZone: deviceTimeZone(),
      ...person,
      id: randomUUID(),
    };
    setPeople((prev) => [...prev, added]);
    setSelectedId(added.id);
    return added;
  }, []);

  const updatePerson = useCallback(
    (id: string, changes: Partial<Omit<Person, "id">>) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    saved.current.clear();
    savedCaregiver.current = null;
    pendingSetup.current = null;
    setData(createInitial());
    setPeople([]);
    setSelectedId(PRIMARY_PERSON_ID);
    setLoadedUserId(null);
    setLoadFailed(false);
    setSaveFailed(false);
    setInvites({});
    setSavedTakerIds(new Set());
  }, []);

  const queueInvite = useCallback((takerId: string, message: string) => {
    setInvites((prev) => ({
      ...prev,
      [takerId]: { inviteId: randomUUID(), message: message.trim() },
    }));
  }, []);

  const prepareSetupSave = useCallback(() => {
    pendingSetup.current = { data: latest.current.data };
  }, []);

  const cancelSetupSave = useCallback(() => {
    pendingSetup.current = null;
  }, []);

  const retry = useCallback(() => {
    if (loadFailed) {
      setLoadFailed(false);
      setLoadAttempt((n) => n + 1);
    }
    if (saveFailed) {
      setSaveFailed(false);
      setSaveAttempt((n) => n + 1);
    }
  }, [loadFailed, saveFailed]);

  // ---- Load: when someone signs in (or retries), save any finished setup, then read it all
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const setup = pendingSetup.current;
        if (setup) {
          const payload = toSavePayload(primaryAsPerson(setup.data));
          if (!payload) throw new Error("The setup has a missing name or phone number");
          await saveCaregiver(userId, caregiverPayload(setup.data));
          await saveTaker(payload);
          pendingSetup.current = null;
        }

        const { caregiver, takers } = await loadEverything(userId);
        if (cancelled) return;

        const [first, ...others] = takers.map(personFromRow);
        const base = createInitial();
        const next: CaregiverSetupData = {
          ...base,
          yourFirstName: caregiver.first_name,
          yourPhone: caregiver.phone ? formatPhone(caregiver.phone) : "",
          yourEmail: caregiver.email ?? "",
          // The photo isn't stored online yet, so keep the one on this phone
          yourPhotoPath: caregiver.photo_path,
          yourPhotoUri: (await photoLink(caregiver.photo_path)) ?? "",
          ...(first && {
            takerId: first.id,
            firstName: first.firstName,
            phone: first.phone,
            method: first.method,
            windowStart: first.windowStart,
            windowEnd: first.windowEnd,
            days: first.days,
            extraMinutes: first.extraMinutes,
            backups: first.backups,
            paused: !!first.paused,
            caregiverRelationship: first.caregiverRelationship ?? "",
            timeZone: first.timeZone ?? base.timeZone,
          }),
        };

        // Remember what the database has, so loading doesn't trigger a save
        saved.current.clear();
        for (const person of [first, ...others]) {
          if (person) saved.current.set(person.id, JSON.stringify(toSavePayload(person)));
        }
        savedCaregiver.current = JSON.stringify(caregiverPayload(next));

        setData(next);
        setPeople(others);
        setSavedTakerIds(new Set(takers.map((t) => t.id)));
        setSelectedId((id) =>
          id === PRIMARY_PERSON_ID || others.some((p) => p.id === id) ? id : PRIMARY_PERSON_ID,
        );
        setLoadedUserId(userId);
      } catch (error) {
        console.warn("Couldn't load the caregiver's setup", error);
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loadAttempt]);

  // ---- Auto-save: after a change, save whoever differs from the database
  const ready = !!userId && loadedUserId === userId;

  useEffect(() => {
    if (!ready || !userId) return;

    const schedule = (key: string, save: () => Promise<void>, onSaved: () => void) => {
      clearTimeout(timers.current.get(key));
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          const previous = queues.current.get(key) ?? Promise.resolve();
          const next = previous.then(async () => {
            try {
              await save();
              onSaved();
            } catch (error) {
              console.warn(`Couldn't save ${key}`, error);
              setSaveFailed(true);
            }
          });
          queues.current.set(key, next);
        }, SAVE_DELAY_MS),
      );
    };

    for (const person of [primaryAsPerson(data), ...people]) {
      const payload = toSavePayload(person);
      if (!payload) continue; // not finished yet (no name, or phone too short)
      const json = JSON.stringify(payload);
      if (saved.current.get(person.id) === json) continue;
      schedule(person.id, () => saveTaker(payload), () => {
        saved.current.set(person.id, json);
        markSaved(person.id);
      });
    }

    const caregiver = caregiverPayload(data);
    const caregiverJson = JSON.stringify(caregiver);
    if (savedCaregiver.current !== caregiverJson) {
      schedule(
        "caregiver",
        () => saveCaregiver(userId, caregiver),
        () => {
          savedCaregiver.current = caregiverJson;
        },
      );
    }
  }, [ready, userId, data, people, saveAttempt, markSaved]);

  // Photo links expire; make a fresh one a little before that
  const photoPath = data.yourPhotoPath;
  useEffect(() => {
    if (!ready || !photoPath) return;
    const timer = setInterval(async () => {
      const link = await photoLink(photoPath);
      if (link) setData((prev) => (prev.yourPhotoPath === photoPath ? { ...prev, yourPhotoUri: link } : prev));
    }, (PHOTO_LINK_SECONDS - 5 * 60) * 1000);
    return () => clearInterval(timer);
  }, [ready, photoPath]);

  const syncStatus: SyncStatus = !userId
    ? "signedOut"
    : loadFailed
      ? "failed"
      : ready
        ? "ready"
        : "loading";

  const value = useMemo(
    () => ({
      ...data,
      people,
      selectedId,
      setSelectedId,
      addPerson,
      updatePerson,
      update,
      reset,
      displayName: data.firstName.trim() || "they",
      syncStatus,
      saveFailed,
      retry,
      prepareSetupSave,
      cancelSetupSave,
      invites,
      queueInvite,
      savedTakerIds,
    }),
    [
      invites,
      queueInvite,
      savedTakerIds,
      data,
      people,
      selectedId,
      addPerson,
      updatePerson,
      update,
      reset,
      syncStatus,
      saveFailed,
      retry,
      prepareSetupSave,
      cancelSetupSave,
    ],
  );

  return (
    <CaregiverSetupContext.Provider value={value}>
      {children}
    </CaregiverSetupContext.Provider>
  );
}

export function useCaregiverSetup() {
  const ctx = useContext(CaregiverSetupContext);
  if (!ctx) {
    throw new Error(
      "useCaregiverSetup must be used inside <CaregiverSetupProvider>. Wrap your <Stack> in _layout.tsx.",
    );
  }
  return ctx;
}
