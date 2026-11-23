"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { moveToNextField } from "@/src/hooks/use-enter-navigation";
import { moveToNextCell } from "./cell-navigation";

/** Next field in a form, or next cell when the combo box sits in an editable table. */
const advance = (field: HTMLElement) => moveToNextField(field) || moveToNextCell(field);

export type ComboBoxOption = { value: string; label: string };

export type ComboBoxProps = {
    id: string;
    labelId: string;
    value: string;
    options: ComboBoxOption[];
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
    /**
     * Where the search box lives.
     * - false (default): type straight into the field; it shows the search text while
     *   typing and the picked value otherwise.
     * - true: the field only shows the picked value; the search box is at the top of
     *   the option list. Good for long lists and table cells.
     */
    searchInModal?: boolean;
    /** Show an "Add new" row at the end of the list. Needs onAddNew. */
    addNew?: boolean;
    /** Called with the text the user searched for, so the add form can start with it. */
    onAddNew?: (searchText: string) => void;
    /** Text of the add row, default "Add new". */
    addNewLabel?: string;
    /** Show an × to clear the value (not shown when required). */
    clearable?: boolean;
    /** Placeholder of the search box when searchInModal is on. */
    searchPlaceholder?: string;
    /** Shown when nothing matches the search. */
    emptyText?: string;
    className?: string;
    /** Open the list as soon as the field gets focus (e.g. reached with Enter). */
    openOnFocus?: boolean;
};

/** Highlight index of the "Add new" row when the list is empty. */
const ADD_NEW = -1;
const LIST_HEIGHT = 280;

const matches = (option: ComboBoxOption, q: string) =>
    option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q);

const isPrintableKey = (event: KeyboardEvent) =>
    event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

/**
 * Single-select combo box.
 *
 * Keys: type to search, Up/Down to move, Enter to pick and go to the next field,
 * Esc to close, Tab to leave. With the list closed, Enter moves on (or opens the
 * list when the field is required and empty). The list floats above the page, so
 * it is not cut off inside tables or dialogs. Optional "Add new" row at the end.
 */
export default function ComboBox({
    id, labelId, value, options, placeholder, required, disabled, onChange,
    searchInModal = false, addNew, onAddNew, addNewLabel = "Add new", clearable = false,
    searchPlaceholder = "Search…", emptyText, className = "", openOnFocus = false,
}: ComboBoxProps) {
    const listId = useId();
    const field = useRef<HTMLInputElement>(null);
    const search = useRef<HTMLInputElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const list = useRef<HTMLUListElement>(null);
    /** Set while focus returns to the field after the list closes, so openOnFocus does not reopen it. */
    const refocusing = useRef(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [typing, setTyping] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null);

    const showAddNew = addNew === true && onAddNew !== undefined;
    const selected = options.find((option) => option.value === value);
    const filtered = useMemo(() => {
        const q = typing ? query.trim().toLowerCase() : "";
        return q ? options.filter((o) => matches(o, q)) : options;
    }, [options, query, typing]);
    const addRowActive = showAddNew && (highlight === filtered.length || (highlight === ADD_NEW && !filtered.length));

    // Keep the list next to the field while it is open.
    useEffect(() => {
        if (!open) return;
        const place = () => {
            const box = field.current?.getBoundingClientRect();
            if (!box) return;
            const above = box.bottom + LIST_HEIGHT > window.innerHeight && box.top > LIST_HEIGHT;
            setRect({ top: above ? box.top - 4 : box.bottom + 4, left: box.left, width: Math.max(box.width, 220), above });
        };
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open]);

    useEffect(() => {
        list.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "nearest" });
    }, [highlight, open]);

    // Search-in-list mode: focus the search box when the list opens, close on an outside click.
    const panelShown = open && rect !== null;
    useEffect(() => {
        if (!panelShown || !searchInModal) return;
        search.current?.focus();
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (panel.current?.contains(target) || field.current?.parentElement?.contains(target)) return;
            close();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
        };
        // close only changes state setters, safe to leave out.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panelShown, searchInModal]);

    const openList = (initialQuery = "") => {
        if (disabled) return;
        setQuery(initialQuery);
        setTyping(initialQuery !== "");
        const index = initialQuery ? 0 : options.findIndex((o) => o.value === value);
        setHighlight(index >= 0 ? index : 0);
        setOpen(true);
    };

    const close = (refocus = false) => {
        setOpen(false);
        setTyping(false);
        setQuery("");
        if (refocus && searchInModal && field.current) {
            refocusing.current = true;
            field.current.focus();
            refocusing.current = false;
        }
    };

    const moveOn = () => {
        const el = field.current;
        // Let the new value render before moving on (the next field may depend on it).
        if (el) requestAnimationFrame(() => advance(el));
    };

    const pick = (option: ComboBoxOption, thenMoveOn: boolean) => {
        if (option.value !== value) onChange(option.value);
        close(true);
        if (thenMoveOn) moveOn();
    };

    const chooseAddNew = () => {
        const text = typing ? query.trim() : "";
        close(true);
        onAddNew?.(text);
    };

    const clear = () => {
        onChange("");
        close();
        field.current?.focus();
    };

    /** Keys while the list is open, shared by the field and the in-list search box. */
    const listKeys = (event: KeyboardEvent<HTMLInputElement>) => {
        const last = showAddNew ? filtered.length : filtered.length - 1;
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setHighlight((h) => (h >= last ? (filtered.length ? 0 : ADD_NEW) : h + 1));
                return true;
            case "ArrowUp":
                event.preventDefault();
                setHighlight((h) => (h <= 0 ? last : h - 1));
                return true;
            case "Home":
            case "PageUp":
                if (!searchInModal && event.key === "Home") return false;
                event.preventDefault();
                setHighlight(0);
                return true;
            case "End":
            case "PageDown":
                if (!searchInModal && event.key === "End") return false;
                event.preventDefault();
                setHighlight(Math.max(last, 0));
                return true;
            case "Enter": {
                // Handled here, so the app-wide Enter handler does not move twice.
                event.preventDefault();
                event.stopPropagation();
                const option = filtered[highlight];
                if (addRowActive) chooseAddNew();
                else if (option) pick(option, true);
                else if (showAddNew && !filtered.length) chooseAddNew();
                return true;
            }
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                close(true);
                return true;
            case "Tab":
                close();
                if (searchInModal) {
                    // Leave the list and continue from the field.
                    event.preventDefault();
                    field.current?.focus();
                }
                return true;
        }
        return false;
    };

    const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (open) {
            // Search-in-list mode: keys pressed before the search box has focus still search.
            if (searchInModal && isPrintableKey(event)) {
                event.preventDefault();
                setQuery((q) => q + event.key);
                setTyping(true);
                setHighlight(0);
                search.current?.focus();
                return;
            }
            listKeys(event);
            return;
        }
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
            case "F4":
                event.preventDefault();
                openList();
                return;
            case " ":
                if (searchInModal) {
                    event.preventDefault();
                    openList();
                }
                return;
            case "Enter":
                event.preventDefault();
                if (value || !required) advance(event.currentTarget);
                else openList();
                return;
            case "Backspace":
            case "Delete":
                if (searchInModal && value && !required) {
                    event.preventDefault();
                    onChange("");
                }
                return;
        }
        // Search-in-list mode: the first typed letter opens the list and starts the search.
        if (searchInModal && isPrintableKey(event)) {
            event.preventDefault();
            openList(event.key);
        }
    };

    const onFieldBlur = () => {
        if (searchInModal) return; // the list's own search box takes focus, outside clicks close it
        // Typed an exact name and left the field: take it.
        if (typing && query.trim()) {
            const exact = options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase());
            if (exact && exact.value !== value) onChange(exact.value);
        }
        close();
    };

    const activeId = !open ? undefined
        : highlight >= 0 && highlight < filtered.length ? `${listId}-${highlight}`
        : addRowActive ? `${listId}-add` : undefined;
    const showClear = clearable && !required && !disabled && !!value;
    const addText = typing && query.trim() ? `${addNewLabel} “${query.trim()}”` : addNewLabel;

    const options_ = (
        <div id={listId} role="listbox" aria-labelledby={labelId}>
        <ul ref={list} role="presentation" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                    {emptyText ?? (options.length ? "No matches" : "No options")}
                </li>
            )}
            {filtered.map((option, index) => {
                const isSelected = option.value === value;
                return (
                    <li key={option.value} id={`${listId}-${index}`} role="option" aria-selected={isSelected}
                        data-active={index === highlight}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => pick(option, false)}
                        className="combo-option flex cursor-pointer items-center gap-2 px-2 py-1 text-xs">
                        <span className="flex-1 truncate">{option.label}</span>
                        {isSelected && <Check size={12} aria-hidden className="shrink-0" />}
                    </li>
                );
            })}
        </ul>
            {/* Outside the scrolling list, so it never covers an option. */}
            {showAddNew && (
                <div id={`${listId}-add`} role="option" aria-selected={false} data-active={addRowActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlight(filtered.length)}
                    onClick={chooseAddNew}
                    className="combo-option combo-action flex cursor-pointer items-center gap-2 border-t border-border bg-card px-2 py-1.5 text-xs font-semibold text-primary-text">
                    <Plus size={15} aria-hidden /> <span className="truncate">{addText}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative w-full ${className}`}>
            {!searchInModal && (
                <Search size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            )}
            <input
                ref={field}
                id={id}
                type="text"
                role="combobox"
                aria-labelledby={labelId}
                aria-autocomplete={searchInModal ? "none" : "list"}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={searchInModal ? undefined : activeId}
                aria-required={required || undefined}
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                placeholder={selected ? selected.label : placeholder}
                value={typing && !searchInModal ? query : selected?.label ?? ""}
                onFocus={(event) => {
                    if (!searchInModal) event.currentTarget.select();
                    if (openOnFocus && !open && !refocusing.current) openList();
                }}
                onClick={() => (open ? undefined : openList())}
                onChange={(event) => {
                    if (searchInModal) return; // typing goes to the search box in the list
                    setQuery(event.target.value);
                    setTyping(true);
                    setHighlight(0);
                    setOpen(true);
                }}
                onKeyDown={onFieldKeyDown}
                onBlur={onFieldBlur}
                className={`w-full z-[0] rounded-lg border border-border bg-background py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                    searchInModal ? "cursor-pointer ps-2.5 caret-transparent" : "ps-8"
                } ${showClear ? "pe-12" : "pe-7"}`}
            />
            {showClear && (
                <button type="button" tabIndex={-1} aria-label="Clear"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clear}
                    className="absolute end-7 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
                    <X size={13} />
                </button>
            )}
            <button type="button" tabIndex={-1} aria-hidden disabled={disabled}
                onMouseDown={(event) => {
                    event.preventDefault();
                    if (open) close(true);
                    else {
                        field.current?.focus();
                        openList();
                    }
                }}
                className="absolute end-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground">
                <ChevronDown size={15} className={`motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {/* Lets a surrounding <form> enforce "required". */}
            {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => undefined}
                className="pointer-events-none absolute bottom-0 start-1/2 h-px w-px opacity-0" />}

            {open && rect && createPortal(
                <div ref={panel}
                    style={{ top: rect.top, left: rect.left, width: rect.width, transform: rect.above ? "translateY(-100%)" : undefined, zIndex: 1500 /* above dialogs (1300) and the header (1100) */ }}
                    className="fixed overflow-hidden rounded-lg border border-border bg-card text-sm text-foreground shadow-xl">
                    {searchInModal && (
                        <div className="relative border-b border-border p-1.5">
                            <Search size={13} aria-hidden className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={search}
                                type="search"
                                role="searchbox"
                                aria-label={searchPlaceholder}
                                aria-controls={listId}
                                aria-activedescendant={activeId}
                                data-enter-nav="off"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder={searchPlaceholder}
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setTyping(true);
                                    setHighlight(0);
                                }}
                                onKeyDown={listKeys}
                                className="w-full rounded-md border border-border bg-background py-1 pe-2 ps-7 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    )}
                    {options_}
                </div>,
                document.body
            )}
        </div>
    );
}
