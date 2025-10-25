"use client";
import React, { useState, useEffect, useRef } from "react";
import { formatDateForAPI } from "@/utils/formatDateForAPI";

interface EditableCellProps {
    value: any;
    type?: "text" | "number" | "date";
    onSave: (newValue: any) => void | Promise<void>;
    onTabNext?: () => void;
    isMobile?: boolean;
}


export default function EditableCell({ value, type = "text", onSave, onTabNext, isMobile }: EditableCellProps) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with parent value
    useEffect(() => {
        setTempValue(value ?? "");
    }, [value]);

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            // Select all text for better mobile experience
            if (type !== "date") {
                inputRef.current?.select();
            }
        }
    }, [editing, type]);

    const handleSave = async () => {
        if (tempValue !== value) {
            try {
                let formattedValue = tempValue;

                if (type === "number") {
                    formattedValue = tempValue === "" ? 0 : parseFloat(tempValue);
                    if (isNaN(formattedValue)) formattedValue = 0;
                } else if (type === "date") {
                    formattedValue = formatDateForAPI(tempValue);
                }

                await onSave(formattedValue);
            } catch (err) {
                console.error("Save failed:", err);
                // Revert on error
                setTempValue(value ?? "");
            }
        }
        setEditing(false);
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            await handleSave();
        } else if (e.key === "Escape") {
            setEditing(false);
            setTempValue(value ?? "");
        } else if (e.key === "Tab") {
            e.preventDefault();
            await handleSave();
            onTabNext?.();
        }
    };

    const handleClick = () => {
        setEditing(true);
    };

    const handleBlur = () => {
        handleSave();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempValue(e.target.value);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                type={type === "date" ? "date" : type === "number" ? "number" : "text"}
                value={tempValue ?? ""}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 px-1 py-0.5 text-sm"
                step={type === "number" ? "0.001" : undefined}
                min={type === "number" ? "0" : undefined}
                // Better mobile experience
                inputMode={type === "number" ? "decimal" : "text"}
                style={{
                    fontSize: isMobile ? '14px' : '12px',
                    minHeight: isMobile ? '32px' : 'auto'
                }}
            />
        );
    }

    // Format display value
    let displayValue = "";
    if (type === "date" && tempValue) {
        const d = new Date(tempValue);
        displayValue = !isNaN(d.getTime()) ? d.toLocaleDateString() : "";
    } else if (type === "number") {
        displayValue = tempValue !== undefined && tempValue !== null && tempValue !== ""
            ? type === "number"
                ? parseFloat(tempValue).toFixed(3)
                : tempValue.toString()
            : "0.000";
    } else {
        displayValue = tempValue ?? "";
    }

    return (
        <div
            onClick={handleClick}
            onDoubleClick={handleClick}
            className="cursor-pointer select-none px-1 py-0.5 min-h-[32px] flex items-center justify-end"
            style={{
                justifyContent: type === "number" ? "flex-end" : "center",
                fontSize: isMobile ? '14px' : '12px'
            }}
        >
            {type === "number" ? (
                <span className="font-mono">{displayValue}</span>
            ) : (
                displayValue || "—"
            )}
        </div>
    );
}