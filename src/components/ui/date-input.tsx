"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";
import { moveToNextField } from "@/src/hooks/use-enter-navigation";

const toDate = (v?: string | null) => {
    const m = (v ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const toValue = (d: Date | null) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";

export interface DateInputProps {
    id?: string;
    /** YYYY-MM-DD (what the API uses), or "" for empty. */
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    maxDate?: Date;
    minDate?: Date;
    inputRef?: React.Ref<HTMLInputElement>;
}

/** Date field shown and typed as DD-MM-YYYY, whatever the browser's locale. */
export default function DateInput({ id, value, onChange, className = "", placeholder = "dd-mm-yyyy", maxDate, minDate, inputRef }: DateInputProps) {
    return (
        <div className="relative">
            <DatePicker
                id={id}
                selected={toDate(value)}
                onChange={(d: Date | null) => onChange(toValue(d))}
                dateFormat="dd-MM-yyyy"
                placeholderText={placeholder}
                maxDate={maxDate}
                minDate={minDate}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                todayButton="Today"
                autoComplete="off"
                onKeyDown={(e) => {
                    // The picker keeps Enter for itself (it picks the date and closes),
                    // so move on to the next field once it has committed the value.
                    if (e.key !== "Enter" || e.shiftKey) return;
                    const input = e.target as HTMLElement;
                    if (input.tagName !== "INPUT") return;
                    setTimeout(() => moveToNextField(input), 0);
                }}
                wrapperClassName="w-full"
                popperClassName="z-[1400]"
                className={`${className} pr-9`}
                ref={inputRef ? (instance: unknown) => {
                    const el = (instance as { input?: HTMLInputElement } | null)?.input ?? null;
                    if (typeof inputRef === "function") inputRef(el);
                    else if (inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                } : undefined}
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
}
