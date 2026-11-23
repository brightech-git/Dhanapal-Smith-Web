"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import type { ComboBoxOption } from "./combo-box";

export type NativeSelectOption = ComboBoxOption;

/** Active / inactive flag as stored by the backend. */
export const ACTIVE_OPTIONS: NativeSelectOption[] = [
    { value: "Y", label: "Active" },
    { value: "N", label: "Inactive" },
];

/** Plain yes / no flag. */
export const YES_NO_OPTIONS: NativeSelectOption[] = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" },
];

type NativeSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "children"> & {
    value: string;
    options: NativeSelectOption[];
    onChange: (value: string) => void;
    /**
     * Empty first row, e.g. "Select…". Leave it out when one option must always be
     * picked (Yes / No, Active / Inactive): the select then always holds a value.
     */
    placeholder?: string;
    /** Look of the box. Defaults to the same look as ComboBox. */
    className?: string;
    /** Class of the wrapper, e.g. a max width. */
    wrapperClassName?: string;
};

const DEFAULT_LOOK =
    "rounded-lg border border-border bg-background py-1.5 ps-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Native <select> for short fixed lists (Yes / No, Active / Inactive, a few
 * modes). No search, no typing: the browser's own list, keyboard and mobile
 * picker. Use ComboBox for long or loaded lists, or when "Add new" is needed.
 * Enter moves to the next field through the app-wide Enter navigation.
 */
const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
    { value, options, onChange, placeholder, className = DEFAULT_LOOK, wrapperClassName = "", disabled, ...rest },
    ref,
) {
    // A value the list does not know (old data) is still shown instead of silently becoming the first option.
    const unknown = value !== "" && !options.some((o) => o.value === value);
    return (
        <div className={`relative w-full ${wrapperClassName}`}>
            <select
                ref={ref}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className={`w-full cursor-pointer appearance-none pe-8 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
                {...rest}
            >
                {(placeholder !== undefined || value === "") && <option value="">{placeholder ?? ""}</option>}
                {unknown && <option value={value}>{value}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={15} aria-hidden
                className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
    );
});

export default NativeSelect;
