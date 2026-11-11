import { useState } from "react";

/**
 * Pull down to reload. Give it a function that resolves once the fresh data
 * is in; `refreshing` stays true until then, so the spinner means something.
 */

export function usePullToRefresh(load: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, refresh };
}
