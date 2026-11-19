"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import DateInput from "@/src/components/ui/date-input";
import ComboBox from "@/src/components/ui/combo-box";
import { CardHeader, card, inputClass } from "@/src/module/role/component/ui";
import { fetchAmountReport, type AmountGroupBy, type AmountReportRow } from "../api/report.api";
import ReportTable, { describeFilters, formatReportDate, formatReportNumber, type ReportColumn } from "./report-table";
import { FilterField, ReportFilterForm, monthToDate } from "./report-filters";

type Filters = { fromDate: string; toDate: string; groupBy: AmountGroupBy };
const initial = (): Filters => ({ ...monthToDate(), groupBy: "SMITH" });
const GROUP_OPTIONS = [
    { value: "SMITH", label: "SMITH-WISE" },
    { value: "DATEWISE", label: "DATE-WISE" },
];
const amount = (v: number | null) => formatReportNumber(v, 2);

/** Amount transaction report (mode A): a total per smith, or per smith per date with smith subtotals. */
export default function AmountReport() {
    const [draft, setDraft] = useState<Filters>(initial);
    const [applied, setApplied] = useState<Filters>(initial);

    const query = useQuery({
        queryKey: ["report", "amount", applied],
        queryFn: () => fetchAmountReport(applied),
    });

    const datewise = applied.groupBy === "DATEWISE";
    const columns = useMemo(() => {
        const list: ReportColumn<AmountReportRow>[] = [
            // Aggregate rows carry their label (SUBTOTAL / GRAND TOTAL) in smithName.
            { key: "smith", label: "SMITH", printLabel: "PARTY NAME", render: (r) => r.smithName ?? "" },
            ...(datewise ? [{ key: "date", label: "DATE", render: (r: AmountReportRow) => formatReportDate(r.tranDate) }] : []),
            { key: "count", label: "COUNT", align: "right", render: (r) => r.transactionCount },
            { key: "issue", label: "ISSUE", align: "right", render: (r) => amount(r.issue) },
            { key: "receipt", label: "RECEIPT", align: "right", render: (r) => amount(r.receipt) },
            { key: "balance", label: "BALANCE", align: "right", render: (r) => amount(r.balance) },
        ];
        return list;
    }, [datewise]);

    const subtitle = describeFilters([
        ["From", formatReportDate(applied.fromDate)],
        ["To", formatReportDate(applied.toDate)],
        ["Group", GROUP_OPTIONS.find((o) => o.value === applied.groupBy)?.label],
    ]);

    return (
        <section className={card}>
            <CardHeader icon={IndianRupee} title="AMOUNT TRANSACTION REPORT" subtitle="Amount issued and received per smith" />
            <ReportFilterForm onSubmit={() => setApplied(draft)} onReset={() => { setDraft(initial()); setApplied(initial()); }} busy={query.isFetching}>
                <FilterField label="FROM DATE" id="ar-from">
                    <DateInput id="ar-from" className={inputClass} value={draft.fromDate}
                        onChange={(fromDate) => setDraft((d) => ({ ...d, fromDate }))} maxDate={new Date()} />
                </FilterField>
                <FilterField label="TO DATE" id="ar-to">
                    <DateInput id="ar-to" className={inputClass} value={draft.toDate}
                        onChange={(toDate) => setDraft((d) => ({ ...d, toDate }))} maxDate={new Date()} />
                </FilterField>
                <FilterField label="GROUP BY" id="ar-group">
                    <ComboBox id="ar-group" labelId="ar-group-label" value={draft.groupBy} options={GROUP_OPTIONS} required
                        placeholder="Smith-wise" onChange={(groupBy) => setDraft((d) => ({ ...d, groupBy: groupBy as AmountGroupBy }))} />
                </FilterField>
            </ReportFilterForm>
            <ReportTable title="Amount transaction report" subtitle={subtitle} defaultPrintColumns={["smith", "receipt", "issue"]} allowColumnFlow defaultColumnsAcross={2} columns={columns} rows={query.data ?? []}
                loading={query.isPending} error={query.isError ? getApiErrorMessage(query.error) : null} />
        </section>
    );
}
