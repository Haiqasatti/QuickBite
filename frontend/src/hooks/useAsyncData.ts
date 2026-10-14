import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../lib/api";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

/**
 * `loader` must be a stable reference (a module-level function or a useCallback).
 * `reload` refreshes silently while keeping the current data on screen;
 * from the error state it shows the loading state again.
 */
export function useAsyncData<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", message: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [loader, nonce]);

  const reload = useCallback(() => {
    setState((previous) => (previous.status === "error" ? { status: "loading" } : previous));
    setNonce((value) => value + 1);
  }, []);

  return { state, reload };
}