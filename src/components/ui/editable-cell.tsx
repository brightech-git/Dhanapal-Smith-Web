"use client";

import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "@/src/providers/toast-provider";
import { formatDateForAPI } from "@/src/utils/format/formatDateForAPI";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Decimal from "decimal.js";
import { activateCell, nextCellPosition } from "./cell-navigation";

interface EditableCellProps {
    value: any;
    type: "text" | "number" | "date" | "numbers" | "password";
    onSave: (value: any) => Promise<void>;
    className?: string;
    displayValue?: string;
    allowNegative?: boolean;
    /** For type "number": digits after the decimal point, shown and saved (default 3). */
    decimals?: number;
}

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    type,
    onSave,
    className = "",
    displayValue,
    allowNegative = false,
    decimals = 3,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // The date picker updates its value after our Enter handler runs, so keep
    // the latest picked date in a ref and read it once the picker is done.
    const latestDate = useRef<Date | null>(null);
    const { addToast } = useToast();

    const parseDate = (val: any) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const [editValue, setEditValue] = useState<any>(
        type === "date"
            ? parseDate(value)
            : (type === "number" || type === "numbers") && value != null
                ? String(value)
                : value ?? ""
    );

    useEffect(() => {
        if (isEditing && type === "date") latestDate.current = editValue instanceof Date ? editValue : parseDate(value);
    }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type !== "date") inputRef.current.select();
        }
    }, [isEditing, type]);

    // Start every edit from this row's current value. The table reuses cell
    // components by position, so the state may still hold another row's value.
    const startEdit = () => {
        setEditValue(
            type === "date"
                ? parseDate(value)
                : (type === "number" || type === "numbers") && value != null
                    ? String(value)
                    : value ?? ""
        );
        setIsEditing(true);
    };

    const handleClick = startEdit;

    const handleBlur = async () => {
        if (isEditing && !isSaving) await saveValue();
    };

    // Date cell: a picked day saves at once and moves on to the next cell.
    const cellRef = useRef<HTMLDivElement>(null);
    const pickDate = async (date: Date | null) => {
        latestDate.current = date;
        setEditValue(date);
        const next = cellRef.current ? nextCellPosition(cellRef.current) : null;
        if (await saveValue(date)) requestAnimationFrame(() => activateCell(next));
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            // Save, then open the next cell in the row (Enter-to-next-field for tables).
            e.preventDefault();
            const next = nextCellPosition(e.currentTarget as Element);
            let override: any = undefined;
            if (type === "date") {
                await new Promise((resolve) => setTimeout(resolve, 0));
                override = latestDate.current;
            }
            if (await saveValue(override)) requestAnimationFrame(() => activateCell(next));
        }
        else if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(
                type === "date"
                    ? value
                        ? new Date(value)
                        : null
                    : (type === "number" || type === "numbers") && value != null
                        ? String(value)
                        : value ?? ""
            );
        }
    };

    const saveValue = async (override?: any): Promise<boolean> => {
        if (isSaving) return false;
        try {
            setIsSaving(true);
            const current = override !== undefined ? override : editValue;
            let finalValue: any = current;

            if (type === "date" && current) {
                finalValue = formatDateForAPI(current);
            }

            if ((type === "number" || type === "numbers") && editValue !== "") {
                const numValue = Number(editValue);
                if (!Number.isFinite(numValue) || (!allowNegative && numValue < 0)) throw new Error("Invalid number");
                finalValue = type === "number"
                    ? new Decimal(String(editValue).trim()).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber()
                    : numValue;
            }

            await onSave(finalValue);

            setIsEditing(false);
            return true;
        } catch (error: any) {
            console.error("Error saving value:", error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const formatDisplayValue = (val: any) => {
        if (val == null || val === "") return "-";
        if (type === "date") {
            const d = new Date(val);
            if (isNaN(d.getTime())) return "-";
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        }
        if (type === "number") return Number.isFinite(Number(val)) ? new Decimal(String(val).trim()).toFixed(decimals, Decimal.ROUND_HALF_UP) : "-";
        if (type === "numbers")
            return Number(val).toFixed(2);
        return val;
    };

    // ---- Edit Mode ----
    if (isEditing) {
        if (type === "date") {
            return (
                <div ref={cellRef} data-cell-nav className="w-full">
                <DatePicker
                    autoFocus
                    // Kept open by us while the cell is being edited, so nothing else can close it.
                    open={!isSaving}
                    shouldCloseOnSelect
                    selected={editValue}
                    onChange={(date: Date | null) => {
                        latestDate.current = date;
                        setEditValue(date);
                    }}
                    // A day picked in the calendar (mouse, or Enter on a day): save and go on.
                    // Enter in the text box itself is handled in onKeyDown.
                    onSelect={(date: Date | null, event?: React.SyntheticEvent) => {
                        if ((event?.target as HTMLElement | undefined)?.tagName !== "INPUT") void pickDate(date);
                    }}
                    // The calendar lives outside the cell, so save on a click elsewhere, not on blur.
                    onClickOutside={() => { if (!isSaving) void saveValue(latestDate.current); }}
                    onKeyDown={(e) => {
                        if (e.key === "Tab") { void saveValue(latestDate.current); return; }
                        void handleKeyDown(e);
                    }}
                    portalId="cell-date-portal"
                    popperPlacement="bottom-start"
                    dateFormat="dd-MM-yyyy"
                    placeholderText="dd-mm-yyyy"
                    todayButton="Today"
                    minDate={new Date("2000-01-01")}
                    maxDate={new Date()}
                    className={`w-full px-1 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring ${isSaving ? "opacity-50 cursor-not-allowed" : ""
                        } ${className}`}
                    disabled={isSaving}
                    popperClassName="custom-datepicker-popper"
                    
                />
                </div>
            );
        }

        return (
            <div data-cell-nav className="flex items-center border border-blue-500 rounded px-2 py-1 w-full bg-card">
                <input
                    ref={inputRef}
                    type={type === "numbers" ? "text" : type}
                    value={editValue ?? ""}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className={`w-full px-1 py-1 border-none outline-none focus:outline-none focus:ring-0 focus:border-none ${isSaving ? "opacity-50 cursor-not-allowed" : ""
                        } ${className}`}
                    maxLength={150}
                />
            </div>
        );
    }

    // ---- View Mode ----
    return (
        <div
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "F2") {
                    e.preventDefault();
                    startEdit();
                }
            }}
            role="button"
            tabIndex={0}
            data-cell-nav
            data-cell-edit
            className={`w-full px-1 py-1 cursor-pointer hover:bg-accent-soft rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
            title="Click or press Enter to edit"
        >
            {/* ✅ Show displayValue (masked password) if available */}
            {displayValue ?? formatDisplayValue(value)}
        </div>
    );
};

export default EditableCell;
