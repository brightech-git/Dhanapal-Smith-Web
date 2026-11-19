"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search } from "lucide-react";
import { api } from "@/lib/api/envelope";
import ComboBox from "@/src/components/ui/combo-box";
import MultiComboBox from "@/src/components/ui/multi-combo-box";
import { ghostButton, primaryButton } from "@/src/module/role/component/ui";
import { metalQueryKey, type Metal } from "@/src/module/metal/metal-form";
import { SmithDetailsService } from "@/src/module/smith/api/smith-details.api";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Default report range: the first of this month to today. */
export const monthToDate = () => {
    const today = new Date();
    return { fromDate: ymd(today), toDate: ymd(today) };
};

/** Filter form: Enter moves field to field, Enter on the last one shows the report. */
export function ReportFilterForm({ onSubmit, onReset, busy, children }: {
    onSubmit: () => void;
    onReset: () => void;
    busy?: boolean;
    children: React.ReactNode;
}) {
    return (
        <form
            className="grid grid-cols-1 items-end gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            {children}
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-6 xl:justify-end">
                <button type="button" className={ghostButton} onClick={onReset}>
                    <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button type="submit" data-enter-submit className={primaryButton} disabled={busy}>
                    <Search className="h-4 w-4" /> Show report
                </button>
            </div>
        </form>
    );
}

/** Smith picker with "All smiths". */
export function SmithFilter({ id, value, onChange }: { id: string; value: string[]; onChange: (value: string[]) => void }) {
    const smiths = useQuery({ queryKey: ["smiths", "report-options"], queryFn: () => SmithDetailsService.getAll() });
    const options = (smiths.data ?? [])
        .filter((s) => s.smithId != null)
        .map((s) => ({ value: String(s.smithId), label: s.pname ?? `#${s.smithId}` }));
    return (
        <FilterField label="SMITHS" id={id}>
            <MultiComboBox id={id} labelId={`${id}-label`} value={value} options={options}
                placeholder={smiths.isPending ? "Loading smiths…" : "All smiths"} onChange={onChange} />
        </FilterField>
    );
}

/** Metal picker with "All metals". */
export function MetalFilter({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
    const metals = useQuery({ queryKey: metalQueryKey, queryFn: () => api.get<Metal[]>("metal") });
    const options = [
        { value: "", label: "ALL METALS" },
        ...(metals.data ?? []).map((m) => ({ value: m.metalId, label: `${m.metalId} · ${m.metalName}` })),
    ];
    return (
        <FilterField label="METAL" id={id}>
            <ComboBox id={id} labelId={`${id}-label`} value={value} options={options}
                placeholder={metals.isPending ? "Loading metals…" : "All metals"} onChange={onChange} />
        </FilterField>
    );
}

/** Label above a filter control (works for combo boxes, which use labelId). */
export function FilterField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0 space-y-1.5">
            <label id={`${id}-label`} htmlFor={id} className="text-xs font-medium">{label}</label>
            {children}
        </div>
    );
}

/** Option label for a value, for the "filters in words" line. */
export const labelOf = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label;
