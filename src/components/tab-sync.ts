"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps several tabs of the app in step: a tab that saves something tells the
 * others, and a tab that becomes visible again checks for changes. Only the
 * notification travels between tabs; each one fetches the data itself.
 */

export type SyncKind = "settings" | "plan";

const CHANNEL = "financecockpit-sync";
// Tells this tab's messages from the others'; a new one for every page load.
const TAB_ID = Math.random().toString(36).slice(2);

let sender: BroadcastChannel | null = null;

/** Tells the other tabs of this browser that something of this kind was saved. */
export function notifyTabs(kind: SyncKind): void {
  try {
    if (typeof BroadcastChannel === "undefined") return;
    sender ??= new BroadcastChannel(CHANNEL);
    sender.postMessage({ kind, from: TAB_ID });
  } catch {
    // Without the channel the tabs still catch up when they become visible.
  }
}

/**
 * Calls `refresh` when another tab saved something of this kind and when this
 * tab comes back into view, which also covers changes from other browsers.
 */
export function useTabSync(kind: SyncKind, refresh: () => void): void {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    const run = () => latest.current();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = (event) => {
          if (event.data?.kind === kind && event.data.from !== TAB_ID) run();
        };
      }
    } catch {
      channel = null;
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    return () => {
      channel?.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
    };
  }, [kind]);
}
