// EditableCell.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/context/smith/ToastContext";
import { formatDateForAPI } from "@/utils/formatDateForAPI";

interface EditableCellProps {
    value: any;
    type: "text" | "number" | "date" | "numbers";
    onSave: (value: any) => Promise<void>;
    className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
    value,
    type,
    onSave,
    className = "",
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type !== "date") {
                inputRef.current.select();
            }
        }
    }, [isEditing, type]);

    const handleClick = () => {
        if (!isEditing) {
            setEditValue(value);
            setIsEditing(true);
        }
    };

    const handleBlur = async () => {
        if (isEditing && !isSaving) {
            await saveValue();
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            await saveValue();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(value);
        }
    };

    const saveValue = async () => {
        if (isSaving) return;

        let trimmedValue = typeof editValue === "string" ? editValue.trim() : editValue;

        // Skip if no change
        if (trimmedValue === value) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);

            // Handle date conversion before saving
            if (type === "date" && trimmedValue) {
                // Convert from yyyy-mm-dd (input) to API format (same)
                trimmedValue = formatDateForAPI(trimmedValue);
            }

            if ((type === "number" || type === "numbers") && trimmedValue !== "") {
                const numValue = parseFloat(trimmedValue);
                if (isNaN(numValue) || numValue < 0) {
                    addToast({
                        type: "error",
                        title: "Invalid Input",
                        message: "Please enter a valid positive number",
                    });
                    return;
                }
            }

            await onSave(trimmedValue);

            addToast({
                type: "success",
                title: "Updated",
                message: "Value updated successfully",
            });

            setIsEditing(false);
        } catch (error: any) {
            console.error("Error saving value:", error);
            addToast({
                type: "error",
                title: "Update Failed",
                message: error.message || "Failed to update value",
            });
            setEditValue(value);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDisplayValue = (val: any) => {
        if (val == null || val === "") return "-";

        if (type === "number") return parseFloat(val).toFixed(3);
        if (type === "numbers")
            return new Intl.NumberFormat("en-IN").format(parseFloat(val));

        if (type === "date") {
            const d = new Date(val);
            if (isNaN(d.getTime())) return val;
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        }

        return val;
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type={type === "date" ? "date" : type === "numbers" ? "text" : type}
                value={
                    type === "date" && editValue
                        ? (() => {
                            const d = new Date(editValue);
                            if (isNaN(d.getTime())) return "";
                            const yyyy = d.getFullYear();
                            const mm = String(d.getMonth() + 1).padStart(2, "0");
                            const dd = String(d.getDate()).padStart(2, "0");
                            return `${yyyy}-${mm}-${dd}`;
                        })()
                        : editValue || ""
                }
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className={`w-full px-1 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isSaving ? "opacity-50 cursor-not-allowed" : ""
                    } ${className}`}
            />
        );
    }

    return (
        <div
            onClick={handleClick}
            className={`w-full px-1 py-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors ${className}`}
            title="Click to edit"
        >
            {formatDisplayValue(value)}
        </div>
    );
};

export default EditableCell;
