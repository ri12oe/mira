// Web: the browser already has localStorage. It's missing while pages are
// pre-rendered in Node, so fall back to undefined (no saved session) there.
export const authStorage: Storage | undefined =
  typeof localStorage === "undefined" ? undefined : localStorage;
