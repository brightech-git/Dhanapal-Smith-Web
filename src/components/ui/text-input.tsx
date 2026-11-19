"use client";

import {
    forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef,
    type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type ReactNode,
} from "react";

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max" | "size">;

export type TextInputProps = NativeProps & {
    /** "text" (default) or "number". Number fields accept digits, one "." and an optional leading "-". */
    type?: "text" | "number" | "email" | "search" | "tel" | "password";
    value: string | number | null | undefined;
    /** Gets the cleaned text: upper-cased for text, digits only for number. */
    onChange: (value: string) => void;
    /** Visible label. Without it, pass aria-label. */
    label?: ReactNode;
    /** Puts the label beside the field instead of above it. */
    inline?: boolean;
    /** Upper-cases text as you type (default true for text). The cursor stays where it is. */
    uppercase?: boolean;
    /** Number: smallest and largest allowed value, applied when you leave the field. */
    min?: number;
    max?: number;
    /** Number: digits after the decimal point. The value is padded to it when you leave the field. */
    decimals?: number;
    /** Number: allow a leading minus sign. */
    allowNegative?: boolean;
    /** Error text shown under the field (also marks it invalid). */
    error?: string;
    /** Help text shown under the field. */
    hint?: ReactNode;
    /** Classes for the wrapper; inputClassName styles the input itself. */
    className?: string;
    inputClassName?: string;
    /** Drops the built-in look so inputClassName alone styles the input (for screens with their own input style). */
    unstyled?: boolean;
};

const base = "w-full rounded-lg border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-muted/40";

/** Keeps only what a number may contain. */
function cleanNumber(text: string, allowNegative: boolean, decimals?: number) {
    let out = "";
    let dot = false;
    for (const [i, ch] of Array.from(text).entries()) {
        if (ch >= "0" && ch <= "9") out += ch;
        else if (ch === "." && !dot && decimals !== 0) { dot = true; out += ch; }
        else if (ch === "-" && allowNegative && i === 0) out += ch;
    }
    if (dot && decimals !== undefined) {
        const [whole, frac] = out.split(".");
        out = `${whole}.${frac.slice(0, decimals)}`;
    }
    return out;
}

/**
 * The one text/number input for every form. Text is upper-cased by default
 * without moving the cursor to the end; numbers are filtered as you type and
 * clamped / padded when you leave the field. Works with Enter-to-next-field.
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({
    type = "text", value, onChange, label, inline = false, uppercase, min, max, decimals, allowNegative = false,
    error, hint, className = "", inputClassName = "", unstyled = false, id, onBlur, maxLength, ...rest
}, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const input = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => input.current as HTMLInputElement);

    const isNumber = type === "number";
    // Upper-case by default for plain text; never for passwords, e-mail or numbers.
    const upper = uppercase ?? (type === "text" || type === "search");
    const text = value === null || value === undefined ? "" : String(value);

    // Where the cursor should go after the parent re-renders with the cleaned value.
    const caret = useRef<number | null>(null);
    useLayoutEffect(() => {
        const el = input.current;
        if (caret.current === null || !el || document.activeElement !== el) return;
        const pos = Math.min(caret.current, el.value.length);
        el.setSelectionRange(pos, pos);
        caret.current = null;
    }); // every render: the value may come back changed (upper-cased, filtered)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value;
        const pos = event.target.selectionStart ?? raw.length;
        let next = raw;
        if (isNumber) next = cleanNumber(raw, allowNegative, decimals);
        else if (upper) next = raw.toUpperCase();
        // Removed characters before the cursor shift it left.
        const target = Math.max(0, pos - (raw.length - next.length));
        caret.current = target;
        onChange(next);
        // If nothing changed (e.g. a letter in a number field) React puts the old
        // text back and the cursor would jump to the end: put it back too.
        if (next === text) {
            const el = event.target;
            requestAnimationFrame(() => {
                if (document.activeElement === el) el.setSelectionRange(target, target);
            });
        }
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        if (isNumber && text !== "" && text !== "-" && text !== ".") {
            let n = Number(text);
            if (Number.isFinite(n)) {
                if (min !== undefined && n < min) n = min;
                if (max !== undefined && n > max) n = max;
                const formatted = decimals !== undefined ? n.toFixed(decimals) : String(n);
                if (formatted !== text) onChange(formatted);
            }
        }
        onBlur?.(event);
    };

    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    const field = (
        <input
            {...rest}
            ref={input}
            id={inputId}
            type={isNumber ? "text" : type}
            inputMode={isNumber ? (decimals === 0 ? "numeric" : "decimal") : rest.inputMode}
            value={text}
            maxLength={maxLength}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            autoComplete={rest.autoComplete ?? "off"}
            className={`${unstyled ? "" : `${base} ${error ? "border-red-500" : "border-border"}`} ${unstyled && error ? "border-red-500" : ""} ${isNumber ? "text-right tabular-nums" : ""} ${inputClassName}`}
        />
    );

    if (!label && !error && !hint) return <div className={className}>{field}</div>;

    return (
        <div className={inline ? `grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-2 gap-y-1 ${className}` : `grid gap-1 ${className}`}>
            {label && (
                <label htmlFor={inputId} className="text-xs font-medium">
                    {label}{rest.required && <span className="text-red-600" aria-hidden> *</span>}
                </label>
            )}
            <div className="min-w-0">
                {field}
                {error && <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
                {!error && hint && <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </div>
        </div>
    );
});

export default TextInput;
