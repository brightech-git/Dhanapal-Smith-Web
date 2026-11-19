// Keyboard shortcuts: what each action is, its recommended key, and the rules
// a key combination must follow. Users change their keys on /keyboard-shortcuts.
//
// A shortcut is either one function key (F2 ... F10) or Ctrl + key /
// Ctrl + Shift + key. Plain letters are not allowed (they are for typing),
// and keys the browser keeps for itself are refused. F1 always opens the
// shortcuts page and cannot be changed. No two actions can share a key.

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { NAV_MENU, type NavItem } from "./nav-menu";

export type ShortcutGroup = "General" | "Actions" | "Navigation";

export interface ShortcutAction {
    id: string;
    label: string;
    group: ShortcutGroup;
    description?: string;
    /** Recommended key, e.g. "F2" or "Ctrl+S". */
    defaultKey?: string;
    /** Fixed actions show their key but it cannot be changed. */
    locked?: boolean;
    /** For navigation: where to go, and the menu the user must be allowed to view. */
    href?: string;
    menuId?: string;
}

export const SHORTCUTS_PATH = "/keyboard-shortcuts";

/** Things a shortcut does on the current page. Pages mark the target with data-shortcut="<id>". */
const ACTIONS: ShortcutAction[] = [
    { id: "help", label: "KEYBOARD SHORTCUTS", group: "General", defaultKey: "F1", locked: true, href: SHORTCUTS_PATH,
        description: "Opens this page" },
    { id: "save", label: "SAVE", group: "Actions", defaultKey: "Ctrl+S",
        description: "Saves the form or row you are in" },
    { id: "print", label: "PRINT", group: "Actions", defaultKey: "Ctrl+P",
        description: "Prints the report or table on the page" },
    { id: "add", label: "ADD NEW ROW", group: "Actions", defaultKey: "F9",
        description: "Adds a row in transactions (the table you are in)" },
    { id: "search", label: "SEARCH", group: "Actions", defaultKey: "Ctrl+Shift+F",
        description: "Moves the cursor to the page's search box" },
];

/** Recommended keys for menu pages; the rest start unassigned. */
const NAV_DEFAULTS: Record<string, string> = {
    transactions: "F2",
    dashboard: "F4",
    orders: "F6",
    "report-weight": "F7",
    "report-amount": "F8",
    "report-smith": "Ctrl+Shift+M",
    "gv-issue": "Ctrl+Shift+G",
};

const leaves = (items: NavItem[], trail: string[] = []): ShortcutAction[] =>
    items.flatMap((item) => item.children
        ? leaves(item.children, [...trail, item.label])
        : item.href && item.href !== SHORTCUTS_PATH
            ? [{
                id: `nav:${item.id}`,
                label: item.label,
                group: "Navigation" as const,
                description: trail.length ? trail.join(" › ") : undefined,
                defaultKey: NAV_DEFAULTS[item.id],
                href: item.href,
                menuId: item.menuId,
            }]
            : []);

/** Every action: general and page actions, then one "go to" per sidebar page. */
export const SHORTCUT_ACTIONS: ShortcutAction[] = [
    ...ACTIONS,
    ...NAV_MENU.flatMap((section) => leaves(section.items)),
];

export type ShortcutBindings = Record<string, string | null>;

export const defaultBindings = (): ShortcutBindings =>
    Object.fromEntries(SHORTCUT_ACTIONS.map((action) => [action.id, action.defaultKey ?? null]));

const FUNCTION_KEYS = new Set(Array.from({ length: 12 }, (_, i) => `F${i + 1}`));

/** Keys the browser or editing keeps: never assignable. */
export const RESERVED_KEYS: Record<string, string> = {
    F5: "reloads the page",
    F11: "full screen",
    F12: "developer tools",
    "Ctrl+R": "reloads the page",
    "Ctrl+Shift+R": "reloads the page",
    "Ctrl+N": "the browser opens a new window",
    "Ctrl+T": "the browser opens a new tab",
    "Ctrl+W": "the browser closes the tab",
    "Ctrl+Shift+N": "the browser opens a private window",
    "Ctrl+Shift+T": "the browser reopens a tab",
    "Ctrl+Shift+W": "the browser closes the window",
    "Ctrl+Shift+I": "developer tools",
    "Ctrl+Shift+J": "developer tools",
    "Ctrl+Shift+C": "developer tools",
    "Ctrl+A": "select all",
    "Ctrl+C": "copy",
    "Ctrl+V": "paste",
    "Ctrl+X": "cut",
    "Ctrl+Z": "undo",
    "Ctrl+Y": "redo",
};

/** "Ctrl+Shift+K", "F2", or null for a key that cannot start a shortcut (plain letters, modifiers alone). */
export function comboFromEvent(event: KeyboardEvent | ReactKeyboardEvent): string | null {
    const key = event.key;
    if (["Control", "Shift", "Alt", "Meta", "AltGraph", "CapsLock"].includes(key)) return null;
    const named = FUNCTION_KEYS.has(key) ? key : null;
    // Letters and digits come from event.code so Shift does not change them ("!" -> "1").
    const code = event.code;
    const base = named
        ?? (/^Key[A-Z]$/.test(code) ? code.slice(3)
            : /^Digit[0-9]$/.test(code) ? code.slice(5)
                : null);
    if (!base) return null;
    if (event.altKey || event.metaKey) return null;
    if (named) {
        // A function key alone, or with Ctrl / Ctrl+Shift.
        return [event.ctrlKey && "Ctrl", event.shiftKey && "Shift", base].filter(Boolean).join("+");
    }
    // A letter or digit needs Ctrl first (optionally with Shift).
    if (!event.ctrlKey) return null;
    return [`Ctrl`, event.shiftKey && "Shift", base].filter(Boolean).join("+");
}

/** Why a key cannot be used for an action, or null when it can. */
export function keyProblem(combo: string, actionId: string, bindings: ShortcutBindings): string | null {
    if (RESERVED_KEYS[combo]) return `${combo} is kept by the browser (${RESERVED_KEYS[combo]}).`;
    if (combo === "F1" && actionId !== "help") return "F1 always opens the keyboard shortcuts page.";
    const owner = Object.entries(bindings).find(([id, key]) => id !== actionId && key === combo);
    if (owner) {
        const action = SHORTCUT_ACTIONS.find((a) => a.id === owner[0]);
        return `${combo} is already used by ${action?.label ?? owner[0]}.`;
    }
    return null;
}

/** Splits "Ctrl+Shift+K" into keys for display. */
export const comboParts = (combo: string) => combo.split("+");
