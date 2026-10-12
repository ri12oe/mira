import type { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Who is signed in. Supabase saves the session on the device, so this
 * starts as "loading", then becomes the saved session (or none).
 */

type AuthState = {
  session: Session | null;
  /** True until the saved session has been read from the device */
  isLoading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    // Fires once right away with the saved session, then on every sign-in/out
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, isLoading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider> (see _layout.tsx).");
  }
  return ctx;
}
