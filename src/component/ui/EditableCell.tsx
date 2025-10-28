'use client';
import React, { useState, useEffect, useRef } from "react";

interface EditableCellProps {
    value: any;
    type?: "text" | "number" | "date" | "numbers";
    onSave: (newValue: any) => void | Promise<void>;
    onBlur?: () => void;
    onTabNext?: () => void;
    isMobile?: boolean;
    autoFocus?: boolean;
}

export default function EditableCell({
    value,
    type = "text",
    onSave,
    onBlur,
    onTabNext,
    isMobile,
    autoFocus = false
}: EditableCellProps) {
    const [editing, setEditing] = useState(autoFocus);
    const [tempValue, setTempValue] = useState(value ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with parent value
    useEffect(() => {
        setTempValue(value ?? "");
    }, [value]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            if (type !== "date") {
                inputRef.current.select();
            }
        }
    }, [editing, type]);

    // Convert dd-mm-yyyy to yyyy-mm-dd for input[type="date"]
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return "";

        if (dateStr.includes('-') && dateStr.split('-')[0]?.length === 2) {
            // dd-mm-yyyy → yyyy-mm-dd
            const [day, month, year] = dateStr.split('-');
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    };

    // Convert yyyy-mm-dd back to dd-mm-yyyy for display
    const formatDateForDisplay = (dateStr: string) => {
        if (!dateStr) return "";

        if (dateStr.includes('-') && dateStr.split('-')[0]?.length === 4) {
            // yyyy-mm-dd → dd-mm-yyyy
            const [year, month, day] = dateStr.split('-');
            return `${day}-${month}-${year}`;
        }
        return dateStr;
    };

    const handleSave = async () => {
        if (tempValue !== value) {
            try {
                let formattedValue = tempValue;

                if (type === "number") {
                    formattedValue = tempValue === "" ? 0 : parseFloat(tempValue);
                    if (isNaN(formattedValue)) formattedValue = 0;
                } else if (type === "date") {
                    // Convert from yyyy-mm-dd (input format) back to dd-mm-yyyy (storage format)
                    formattedValue = formatDateForDisplay(tempValue);
                }
                else if (type === "numbers") {
                    formattedValue = tempValue === "" ? 0 : parseFloat(tempValue);
                    if (isNaN(formattedValue)) formattedValue = 0;
                }

                await onSave(formattedValue);
            } catch (err) {
                console.error("Save failed:", err);
                setTempValue(value ?? "");
            }
        }
        setEditing(false);
        onBlur?.();
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            await handleSave();
        } else if (e.key === "Escape") {
            setEditing(false);
            setTempValue(value ?? "");
            onBlur?.();
        } else if (e.key === "Tab") {
            e.preventDefault();
            await handleSave();
            onTabNext?.();
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        setEditing(true);
    };

    const handleBlur = () => {
        handleSave();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(e.target.value);
    };

    // If we're in editing mode or autoFocus is true
    if (editing || autoFocus) {
        return (
            <input
                ref={inputRef}
                type={type === "date" ? "date" : type === "number" ? "number" : "text"}
                value={type === "date" ? formatDateForInput(tempValue) : tempValue ?? ""}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 text-sm"
                step={type === "number" ? "0.001" : undefined}
                min={type === "number" ? "0" : undefined}
                inputMode={type === "number" ? "decimal" : "text"}
                style={{
                    fontSize: isMobile ? '14px' : '14px',
                    minHeight: isMobile ? '32px' : 'auto'
                }}
                autoFocus={autoFocus}
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
            />
        );
    }

    // Format display value
    let displayValue = "";
    if (type === "date" && tempValue) {
        // For display, show in dd-mm-yyyy format
        displayValue = formatDateForDisplay(tempValue);
    } else if (type === "number") {
        displayValue = tempValue !== undefined && tempValue !== null && tempValue !== ""
            ? parseFloat(tempValue).toFixed(3)
            : "0.000";
    }
    else if (type === "numbers") {
        displayValue = tempValue !== undefined && tempValue !== null && tempValue !== ""
            ? parseFloat(tempValue).toFixed(2)
            : "0.00";
    } else {
        displayValue = tempValue ?? "";
    }

    return (
        <div
            onClick={handleClick}
            onDoubleClick={handleClick}
            className="cursor-pointer select-none px-1 py-1 min-h-[10px] flex items-center rounded hover:bg-gray-50 transition-colors"
            style={{
                justifyContent: type === "number" || type === "numbers" ? "flex-end" : "flex-start",
                fontSize: isMobile ? "14px" : "14px",
            }}
        >
            {type === "number" || type === "numbers" ? (
                <span className="font">{displayValue}</span>
            ) : (
                displayValue || "—"
            )}
        </div>
    );
}