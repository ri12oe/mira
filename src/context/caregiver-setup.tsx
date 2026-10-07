import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

/**
 * Holds everything the caregiver enters during setup (steps 1–3),
 * so every setup screen can read and update the same answers.
 */

export type CheckInMethod = "text" | "call" | "app";

export type Backup = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  alertAfter: number; // minutes
};

/** Someone added later from the home screen, in addition to the person set up in steps 1�3 */
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
};

export type CaregiverSetupData = {
  firstName: string;
  phone: string;
  yourFirstName: string;
  yourPhone: string;
  windowStart: number; // minutes after midnight
  windowEnd: number;
  method: CheckInMethod;
  extraMinutes: number;
  backups: Backup[]; // in alert order, after the caregiver
};

type CaregiverSetupContextValue = CaregiverSetupData & {
  /** Change one or more answers, e.g. update({ firstName: "Lin" }) */
  update: (changes: Partial<CaregiverSetupData>) => void;
  /** Other people the caregiver looks after (the first person lives in the fields above) */
  people: Person[];
  addPerson: (person: Omit<Person, "id">) => Person;
  /** Clear everything, e.g. after the invite is sent */
  reset: () => void;
  /** The name to show in headings: "Lin", or "they" if nothing was typed yet */
  displayName: string;
};

const INITIAL: CaregiverSetupData = {
  firstName: "",
  phone: "",
  yourFirstName: "",
  yourPhone: "",
  windowStart: 9 * 60,
  windowEnd: 11 * 60,
  method: "text",
  extraMinutes: 30,
  backups: [],
};

const CaregiverSetupContext = createContext<CaregiverSetupContextValue | null>(
  null,
);

export function CaregiverSetupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CaregiverSetupData>(INITIAL);

  const update = useCallback((changes: Partial<CaregiverSetupData>) => {
    setData((prev) => ({ ...prev, ...changes }));
  }, []);

  const [people, setPeople] = useState<Person[]>([]);

  const addPerson = useCallback((person: Omit<Person, "id">) => {
    const added: Person = { ...person, id: `${Date.now()}-${Math.random()}` };
    setPeople((prev) => [...prev, added]);
    return added;
  }, []);

  const reset = useCallback(() => {
    setData(INITIAL);
    setPeople([]);
  }, []);

  const value = useMemo(
    () => ({
      ...data,
      people,
      addPerson,
      update,
      reset,
      displayName: data.firstName.trim() || "they",
    }),
    [data, people, addPerson, update, reset],
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
