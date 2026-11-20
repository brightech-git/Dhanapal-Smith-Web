"use client";

import { Paperclip } from "lucide-react";
import { attachmentCount } from "@/src/module/smith/api/smith-attachments.api";

/** Paperclip button for a cash/weight row; disabled until the row is saved. */
export default function AttachButton({ row, onClick }: { row: any; onClick: () => void }) {
    const count = attachmentCount(row);
    const saved = !!row?.id;
    if (!saved && !row?.isNew) return <span className="opacity-0">-</span>;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!saved}
            title={saved ? "Attachments" : "Save the row first"}
            className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent-soft hover:text-primary-text disabled:opacity-40"
        >
            <Paperclip className="h-4 w-4" />
            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {count}
                </span>
            )}
        </button>
    );
}
