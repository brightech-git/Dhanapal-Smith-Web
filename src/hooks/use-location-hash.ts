"use client";

import { useEffect, useState } from "react";

const EVENT = "app:hash-change";

/**
 * Pages that change their tab with history.replaceState (no hashchange event)
 * call this so the sidebar and header follow the new tab.
 */
export const notifyHashChange = () => window.dispatchEvent(new Event(EVENT));

/** The URL hash without "#", kept in sync across page changes and tab changes. */
export function useLocationHash(pathname: string) {
    const [hash, setHash] = useState("");

    useEffect(() => {
        const sync = () => setHash(window.location.hash.replace(/^#/, ""));
        sync();
        window.addEventListener("hashchange", sync);
        window.addEventListener(EVENT, sync);
        return () => {
            window.removeEventListener("hashchange", sync);
            window.removeEventListener(EVENT, sync);
        };
    }, [pathname]);

    return hash;
}
