"use client";

import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "@/context/smith/ToastContext";
import { formatDateForAPI } from "@/utils/formatDateForAPI";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface EditableCellProps {
    value: any;
    type: "text" | "number" | "date" | "numbers" | "password";
    onSave: (value: any) => Promise<void>;
    className?: string;
    displayValue?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    type,
    onSave,
    className = "",
    displayValue,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
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
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type !== "date") inputRef.current.select();
        }
    }, [isEditing, type]);

    const handleClick = () => setIsEditing(true);

    const handleBlur = async () => {
        if (isEditing && !isSaving) await saveValue();
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") await saveValue();
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

    const saveValue = async () => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            let finalValue: any = editValue;

            if (type === "date" && editValue) {
                finalValue = formatDateForAPI(editValue);
            }

            if ((type === "number" || type === "numbers") && editValue !== "") {
                const numValue = parseFloat(editValue);
                if (isNaN(numValue) || numValue < 0) throw new Error("Invalid number");
                finalValue = numValue;
            }

            await onSave(finalValue);

            setIsEditing(false);
        } catch (error: any) {
            console.error("Error saving value:", error);
          
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
        if (type === "number") return parseFloat(val).toFixed(3);
        if (type === "numbers")
            return new Intl.NumberFormat("en-IN").format(parseFloat(val));
        return val;
    };

    // ---- Edit Mode ----
    if (isEditing) {
        if (type === "date") {
            return (
                <DatePicker
                    selected={editValue}
                    onChange={(date: Date | null) => setEditValue(date)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="dd-mm-yyyy"
                    todayButton="Today"
                    minDate={new Date("2000-01-01")}
                    maxDate={new Date("2100-12-31")}
                    className={`w-full px-1 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isSaving ? "opacity-50 cursor-not-allowed" : ""
                        } ${className}`}
                    disabled={isSaving}
                    popperClassName="custom-datepicker-popper"
                />
            );
        }

        return (
            <div className="flex items-center border border-blue-500 rounded px-2 py-1 w-full bg-white">
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
                />
            </div>
        );
    }

    // ---- View Mode ----
    return (
        <div
            onClick={handleClick}
            className={`w-full px-1 py-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors ${className}`}
            title="Click to edit"
        >
            {/* ✅ Show displayValue (masked password) if available */}
            {displayValue ?? formatDisplayValue(value)}
        </div>
    );
};

export default EditableCell;
