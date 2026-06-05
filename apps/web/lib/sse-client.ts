/*
 * Purpose: SSE client helper and React hook placeholders.
 */
import { useEffect, useState } from "react";

export type SseState<T> = {
  data: T | null;
  error: string | null;
  connected: boolean;
};

export function useEventSource<T>(url: string): SseState<T> {
  // TODO: implement EventSource subscription lifecycle
  useEffect(() => {
    // TODO: connect and cleanup
  }, [url]);

  return { data: null, error: null, connected: false };
}
