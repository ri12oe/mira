import { useEffect, useState } from "react";

import { isDemoAccount } from "@/lib/demo";

/** True once the server says this is a demo account (false until then, and if offline) */
export function useDemoAccount() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true; // ignore the answer if the screen has gone
    isDemoAccount().then((yes) => {
      if (active) setIsDemo(yes);
    });
    return () => {
      active = false;
    };
  }, []);

  return isDemo;
}