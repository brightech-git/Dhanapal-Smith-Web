"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { getAxiosInstance } from "@/lib/api/client";
import { fetchTranDatabases, getTranDb, loadCurrentTranDb, onTranDbChange, setTranDb } from "@/lib/api/tran-db";

const ddmmyyyy = (value?: string | null) => {
    const m = (value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

/**
 * Header picker for the transaction period (tranDb). Opens on today's period;
 * choosing another one reloads the screens with that period's data.
 */
export default function TranDbPicker() {
    const [current, setCurrent] = useState<string | null>(null);
    const databases = useQuery({ queryKey: ["dbmaster"], queryFn: () => fetchTranDatabases(getAxiosInstance()) });

    useEffect(() => {
        setCurrent(getTranDb());
        if (!getTranDb()) void loadCurrentTranDb(getAxiosInstance()).then((name) => setCurrent(getTranDb() ?? name));
        return onTranDbChange(setCurrent);
    }, []);

    const list = databases.data ?? [];
    const selected = list.find((db) => db.dbname === current);
    const title = selected
        ? `${selected.dbname}: ${ddmmyyyy(selected.startdate)} to ${ddmmyyyy(selected.enddate)}${selected.closed === "Y" ? " (closed, read-only)" : ""}`
        : current ?? "Transaction period";

    if (!current && !list.length) return null;

    return (
        <label title={title}
            className={`hidden shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs md:flex ${selected?.closed === "Y" ? "border-amber-500/60 bg-amber-500/10" : "border-border bg-background/60"}`}>
            <Database size={14} aria-hidden className="text-muted-foreground" />
            <span className="sr-only">Transaction period</span>
            <select value={current ?? ""} aria-label="Transaction period"
                onChange={(event) => {
                    const name = event.target.value;
                    if (!name || name === current) return;
                    setTranDb(name);
                    // Every screen holds data of the old period: start them again with the new one.
                    window.location.reload();
                }}
                className="max-w-44 cursor-pointer bg-transparent font-semibold uppercase outline-none">
                {!selected && current && <option value={current}>{current}</option>}
                {list.map((db) => (
                    <option key={db.dbname} value={db.dbname}>
                        {db.dbname} ({ddmmyyyy(db.startdate)} – {ddmmyyyy(db.enddate)}){db.closed === "Y" ? " · CLOSED" : ""}
                    </option>
                ))}
            </select>
        </label>
    );
}
