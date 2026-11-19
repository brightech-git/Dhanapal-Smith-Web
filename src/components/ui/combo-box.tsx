"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { moveToNextField } from "@/src/hooks/use-enter-navigation";
import { moveToNextCell } from "./cell-navigation";

/** Next field in a form, or next cell when the combo box sits in an editable table. */
const advance = (field: HTMLElement) => moveToNextField(field) || moveToNextCell(field);

export type ComboBoxOption = { value: string; label: string };

type ComboBoxProps = {
    id: string;
    labelId: string;
    value: string;
    options: ComboBoxOption[];
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
    addNew?: boolean;
    onAddNew?: () => void;
    className?: string;
    /** Open the list as soon as the field gets focus (e.g. reached with Enter). */
    openOnFocus?: boolean;
};

const ADD_NEW = -1;

/**
 * Searchable combo box: type to filter, Up/Down to move, Enter to pick and go
 * to the next field, Esc to close. The list floats above the page, so it is
 * not cut off inside tables or dialogs. Optional "Add new" row at the bottom.
 */
export default function ComboBox({
    id, labelId, value, options, placeholder, required, disabled, onChange, addNew, onAddNew, className = "", openOnFocus = false,
}: ComboBoxProps) {
    const listId = useId();
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [typing, setTyping] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [rect, setRect] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null);

    const showAddNew = addNew === true && onAddNew !== undefined;
    const selected = options.find((option) => option.value === value);
    const filtered = useMemo(() => {
        const q = typing ? query.trim().toLowerCase() : "";
        return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)) : options;
    }, [options, query, typing]);

    // Keep the list next to the input while it is open.
    useEffect(() => {
        if (!open) return;
        const place = () => {
            const box = input.current?.getBoundingClientRect();
            if (!box) return;
            const above = box.bottom + 280 > window.innerHeight && box.top > 280;
            setRect({ top: above ? box.top - 4 : box.bottom + 4, left: box.left, width: Math.max(box.width, 200), above });
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

    const openList = () => {
        if (disabled) return;
        const index = filtered.findIndex((o) => o.value === value);
        setHighlight(index >= 0 ? index : 0);
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setTyping(false);
        setQuery("");
    };

    const pick = (option: ComboBoxOption, moveOn: boolean) => {
        if (option.value !== value) onChange(option.value);
        close();
        if (moveOn && input.current) {
            const field = input.current;
            // Let the new value render before moving on (the next field may depend on it).
            requestAnimationFrame(() => advance(field));
        }
    };

    const chooseAddNew = () => {
        close();
        onAddNew?.();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const last = showAddNew ? filtered.length : filtered.length - 1;
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (!open) openList();
                else setHighlight((h) => (h >= last ? (filtered.length ? 0 : ADD_NEW) : h + 1));
                break;
            case "ArrowUp":
                event.preventDefault();
                if (!open) openList();
                else setHighlight((h) => (h <= 0 ? last : h - 1));
                break;
            case "Enter": {
                // Handled here, so the app-wide Enter handler does not move twice.
                event.preventDefault();
                if (!open) {
                    if (value || !required) advance(event.currentTarget);
                    else openList();
                    return;
                }
                if (showAddNew && (highlight === filtered.length || (highlight === ADD_NEW && !filtered.length))) {
                    chooseAddNew();
                    return;
                }
                const option = filtered[highlight];
                if (option) pick(option, true);
                else if (showAddNew && !filtered.length) chooseAddNew();
                break;
            }
            case "Escape":
                if (open) {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }
                break;
            case "Tab":
                close();
                break;
        }
    };

    const onBlur = () => {
        // Typed an exact name and left the field: take it.
        if (typing && query.trim()) {
            const exact = options.find((o) => o.label.toLowerCase() === query.trim().toLowerCase());
            if (exact && exact.value !== value) onChange(exact.value);
        }
        close();
    };

    const activeId = open && (highlight >= 0 && highlight < filtered.length) ? `${listId}-${highlight}` : open && showAddNew ? `${listId}-add` : undefined;

    return (
        <div className={`relative w-full ${className}`}>
            <Search size={14} aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
                ref={input}
                id={id}
                type="text"
                role="combobox"
                aria-labelledby={labelId}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={activeId}
                aria-required={required || undefined}
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                placeholder={selected ? selected.label : placeholder}
                value={typing ? query : selected?.label ?? ""}
                onFocus={(event) => {
                    event.currentTarget.select();
                    if (openOnFocus && !open) openList();
                }}
                onClick={() => (open ? undefined : openList())}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setTyping(true);
                    setHighlight(0);
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                className="w-full z-[0] rounded-lg border border-border text-xs bg-background py-1.5 pe-7 ps-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button type="button" tabIndex={-1} aria-hidden disabled={disabled}
                onMouseDown={(event) => {
                    event.preventDefault();
                    if (open) close();
                    else {
                        input.current?.focus();
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
                <ul ref={list} id={listId} role="listbox" aria-labelledby={labelId}
                    style={{ top: rect.top, left: rect.left, width: rect.width, transform: rect.above ? "translateY(-100%)" : undefined, zIndex: 1500 /* above dialogs (1300) and the header (1100) */ }}
                    className="fixed max-h-64 overflow-y-auto rounded-lg border border-border bg-card py-1 text-sm text-foreground shadow-xl">
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-muted-foreground">{options.length ? "No matches" : "No options"}</li>
                    )}
                    {filtered.map((option, index) => {
                        const isSelected = option.value === value;
                        const active = index === highlight;
                        return (
                            <li key={option.value} id={`${listId}-${index}`} role="option" aria-selected={isSelected} data-active={active}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => setHighlight(index)}
                                onClick={() => pick(option, false)}
                                className={`flex cursor-pointer items-center gap-2 text-xs px-2 py-1 ${active ? "bg-accent-soft text-primary-text" : ""}`}>
                                <span className="flex-1 truncate">{option.label}</span>
                                {isSelected && <Check size={12} aria-hidden className="shrink-0" />}
                            </li>
                        );
                    })}
                    {showAddNew && (
                        <li id={`${listId}-add`} role="option" aria-selected={false}
                            data-active={highlight === filtered.length || (highlight === ADD_NEW && !filtered.length)}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setHighlight(filtered.length)}
                            onClick={chooseAddNew}
                            className={`sticky bottom-0 mt-1 flex cursor-pointer items-center gap-2 border-t border-border bg-card px-2 py-1 text-xs font-semibold text-primary-text ${
                                highlight === filtered.length ? "bg-accent-soft" : ""
                            }`}>
                            <Plus size={15} aria-hidden /> Add new
                        </li>
                    )}
                </ul>,
                document.body
            )}
        </div>
    );
}
