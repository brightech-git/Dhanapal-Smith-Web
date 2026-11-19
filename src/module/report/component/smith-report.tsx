"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import { CardHeader, card } from "@/src/module/role/component/ui";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import { fetchSmithReport, type SmithReportRow } from "../api/report.api";
import ReportTable, { describeFilters, formatReportNumber, type ReportColumn } from "./report-table";
import { MetalFilter, ReportFilterForm } from "./report-filters";

/** Smith summary report: weight balance per metal and amount balance per smith, with smith subtotals and a grand total. */
export default function SmithReport() {
    const { weightItems } = useSoftControlFlags();
    const [draft, setDraft] = useState("");
    const [applied, setApplied] = useState("");
    // Metal only applies when weight rows carry items (WEIGHTITEM = Y).
    const metalId = weightItems ? applied : "";

    const query = useQuery({
        queryKey: ["report", "smith", metalId],
        queryFn: () => fetchSmithReport(metalId || undefined),
    });

    const columns = useMemo(() => {
        const list: ReportColumn<SmithReportRow>[] = [
            // Aggregate rows carry their label (SUBTOTAL / GRAND TOTAL) in smithName.
            { key: "smith", label: "SMITH", render: (r) => r.smithName ?? "" },
            ...(weightItems ? [{ key: "metal", label: "METAL", render: (r: SmithReportRow) => r.metalName ?? r.metalId ?? "" }] : []),
            { key: "weight", label: "WEIGHT BALANCE", align: "right", render: (r) => formatReportNumber(r.weight, 3) },
            { key: "amount", label: "AMOUNT BALANCE", align: "right", render: (r) => formatReportNumber(r.amount, 2) },
        ];
        return list;
    }, [weightItems]);

    // A smith with a single row gets no subtotal: it would only repeat that row.
    const rows = useMemo(() => {
        const out: SmithReportRow[] = [];
        let records = 0;
        for (const row of query.data ?? []) {
            if (row.resultSet === 1) records++;
            else if (row.resultSet === 2) {
                const single = records === 1;
                records = 0;
                if (single) continue;
            }
            out.push(row);
        }
        return out;
    }, [query.data]);

    return (
        <section className={card}>
            <CardHeader icon={Users} title="SMITH SUMMARY REPORT" subtitle="Weight and amount balance of every smith (receipt minus issue)" />
            {weightItems && (
                <ReportFilterForm onSubmit={() => setApplied(draft)} onReset={() => { setDraft(""); setApplied(""); }} busy={query.isFetching}>
                    <MetalFilter id="sr-metal" value={draft} onChange={setDraft} />
                </ReportFilterForm>
            )}
            <ReportTable title="Smith summary report" subtitle={describeFilters([["Metal", metalId]])}
                columns={columns} rows={rows}
                loading={query.isPending} error={query.isError ? getApiErrorMessage(query.error) : null} />
        </section>
    );
}
