"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";
import { useToast } from "@/src/providers/toast-provider";
import {
    SHORTCUT_ACTIONS, comboFromEvent, defaultBindings, keyProblem,
    type ShortcutAction, type ShortcutBindings,
} from "@/src/config/keyboard-shortcuts";

const STORAGE_KEY = "smith.keyboard-shortcuts";

type ShortcutContextValue = {
    bindings: ShortcutBindings;
    /** Actions this user may use (navigation only for pages they can open). */
    actions: ShortcutAction[];
    /** Sets (or clears, with null) an action's key. Returns why it was refused, or null. */
    setBinding: (actionId: string, combo: string | null) => string | null;
    resetBinding: (actionId: string) => void;
    resetAll: () => void;
    /** While true (the page is waiting for a new key), shortcuts do nothing. */
    setRecording: (recording: boolean) => void;
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

/** Saved keys over the recommended ones; F1 stays on the shortcuts page and duplicates are dropped. */
function loadBindings(): ShortcutBindings {
    const bindings = defaultBindings();
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ShortcutBindings;
        for (const action of SHORTCUT_ACTIONS) {
            if (action.locked || !(action.id in saved)) continue;
            bindings[action.id] = saved[action.id] ?? null;
        }
    } catch {
        // Unreadable storage: use the recommended keys.
    }
    const used = new Set<string>();
    for (const action of SHORTCUT_ACTIONS) {
        const key = bindings[action.id];
        if (!key) continue;
        if (used.has(key) || (key === "F1" && action.id !== "help")) bindings[action.id] = null;
        else used.add(key);
    }
    return bindings;
}

function saveBindings(bindings: ShortcutBindings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    } catch {
        // Private mode or storage blocked: keys last until the tab closes.
    }
}

const isVisible = (el: Element) => {
    const box = el as HTMLElement;
    return !!(box.offsetWidth || box.offsetHeight || box.getClientRects().length) && !box.closest("[aria-hidden=true], [inert]");
};
const usable = (el: Element) => isVisible(el) && !(el as HTMLButtonElement).disabled;

/**
 * Finds the control a page action should use: first the one in the row, form,
 * dialog or section the cursor is in, then one in an open dialog, then the first on the page.
 */
function findTarget(selector: string): HTMLElement | null {
    const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement : null;
    const pick = (scope: ParentNode | null | undefined) =>
        scope ? Array.from(scope.querySelectorAll<HTMLElement>(selector)).find(usable) ?? null : null;
    if (active) {
        for (const scope of ["tr", "form", "[role=dialog], dialog[open]", "section"]) {
            const found = pick(active.closest(scope));
            if (found) return found;
        }
    }
    const dialog = Array.from(document.querySelectorAll("[role=dialog], dialog[open]")).filter(isVisible).pop();
    return pick(dialog) ?? pick(document);
}

/** App-wide keyboard shortcuts. Mount once inside the app shell. */
export function ShortcutProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, allDetails } = useAuth();
    const { addToast } = useToast();
    const [bindings, setBindings] = useState<ShortcutBindings>(defaultBindings);
    const recording = useRef(false);

    useEffect(() => setBindings(loadBindings()), []);

    const actions = useMemo(
        () => SHORTCUT_ACTIONS.filter((a) => !a.menuId || canViewMenu(allDetails, a.menuId)),
        [allDetails]
    );

    const update = useCallback((next: ShortcutBindings) => {
        setBindings(next);
        saveBindings(next);
    }, []);

    const setBinding = useCallback((actionId: string, combo: string | null) => {
        const action = SHORTCUT_ACTIONS.find((a) => a.id === actionId);
        if (!action || action.locked) return "This shortcut cannot be changed.";
        if (combo) {
            const problem = keyProblem(combo, actionId, bindings);
            if (problem) return problem;
        }
        update({ ...bindings, [actionId]: combo });
        return null;
    }, [bindings, update]);

    const resetBinding = useCallback((actionId: string) => {
        const action = SHORTCUT_ACTIONS.find((a) => a.id === actionId);
        const key = action?.defaultKey ?? null;
        // The recommended key may have been given to another action meanwhile: free it from that one.
        const next = { ...bindings };
        if (key) for (const [id, k] of Object.entries(next)) if (k === key && id !== actionId) next[id] = null;
        next[actionId] = key;
        update(next);
    }, [bindings, update]);

    const resetAll = useCallback(() => update(defaultBindings()), [update]);
    const setRecording = useCallback((value: boolean) => { recording.current = value; }, []);

    // Runs a page action; returns false when the page has nothing for it.
    const runPageAction = useCallback((id: string) => {
        if (id === "search") {
            const field = findTarget('[data-shortcut="search"], input[type=search], input[aria-label^="Search" i]');
            if (!field) return false;
            field.focus();
            if (field instanceof HTMLInputElement) field.select();
            return true;
        }
        if (id === "save") {
            // A table cell being edited saves when it loses focus.
            const active = document.activeElement as HTMLElement | null;
            const button = findTarget('[data-shortcut="save"], [data-enter-submit]');
            if (button) {
                button.click();
                return true;
            }
            if (active?.closest("[data-cell-nav]")) {
                active.blur();
                return true;
            }
            return false;
        }
        const target = findTarget(`[data-shortcut="${id}"]`);
        if (!target) return false;
        target.click();
        return true;
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (recording.current || event.repeat) return;
            const combo = comboFromEvent(event);
            if (!combo) return;
            const actionId = Object.keys(bindings).find((id) => bindings[id] === combo);
            const action = actionId ? actions.find((a) => a.id === actionId) : undefined;
            if (!action) return;
            event.preventDefault();
            event.stopPropagation();
            if (action.href) {
                router.push(action.href);
                return;
            }
            if (!runPageAction(action.id)) {
                addToast({ type: "info", title: action.label, message: `Nothing to ${action.label.toLowerCase()} on this page.` });
            }
        };
        // Capture phase, so the browser's own Ctrl+S / Ctrl+P / F1 do not run.
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [isAuthenticated, bindings, actions, router, runPageAction, addToast]);

    const value = useMemo(
        () => ({ bindings, actions, setBinding, resetBinding, resetAll, setRecording }),
        [bindings, actions, setBinding, resetBinding, resetAll, setRecording]
    );
    return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}

export const useShortcuts = () => {
    const context = useContext(ShortcutContext);
    if (!context) throw new Error("useShortcuts must be used inside ShortcutProvider");
    return context;
};
