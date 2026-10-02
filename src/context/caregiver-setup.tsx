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

export type CaregiverSetupData = {
  firstName: string;
  phone: string;
  yourFirstName: string;
  yourPhone: string;
  windowStart: number; // minutes after midnight
  windowEnd: number;
  method: CheckInMethod;
};

type CaregiverSetupContextValue = CaregiverSetupData & {
  /** Change one or more answers, e.g. update({ firstName: "Lin" }) */
  update: (changes: Partial<CaregiverSetupData>) => void;
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
};

const CaregiverSetupContext = createContext<CaregiverSetupContextValue | null>(
  null,
);

export function CaregiverSetupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CaregiverSetupData>(INITIAL);

  const update = useCallback((changes: Partial<CaregiverSetupData>) => {
    setData((prev) => ({ ...prev, ...changes }));
  }, []);

  const reset = useCallback(() => setData(INITIAL), []);

  const value = useMemo(
    () => ({
      ...data,
      update,
      reset,
      displayName: data.firstName.trim() || "they",
    }),
    [data, update, reset],
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
