"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/envelope";
import DateInput from "@/src/components/ui/date-input";
import { fetchItems, itemQueryKey, type Item } from "@/src/module/item/item-form";
import ComboBox from "@/src/components/ui/combo-box";
import { CardHeader, card, inputClass } from "@/src/module/role/component/ui";
import { useSoftControlFlags } from "@/src/module/smith/context/soft-control-context";
import { REPORT_TRAN_TYPES, fetchWeightReport, type WeightReportRow } from "../api/report.api";
import ReportTable, { describeFilters, formatReportDate, formatReportNumber, type ReportColumn } from "./report-table";
import { FilterField, MetalFilter, ReportFilterForm, SmithFilter, monthToDate } from "./report-filters";

type Filters = { fromDate: string; toDate: string; tranType: string; smithIds: string[]; itemId: string; metalId: string };
const initial = (): Filters => ({ ...monthToDate(), tranType: "", smithIds: [], itemId: "", metalId: "" });
const TYPE_OPTIONS = [{ value: "", label: "ALL TYPES" }, ...REPORT_TRAN_TYPES];
const wt = (v: number | null) => formatReportNumber(v, 3);

/** Weight transaction report (mode W): records by date, item and type, with type subtotals, metal totals and a grand total. */
export default function WeightReport() {
    const { weightItems } = useSoftControlFlags();
    const [draft, setDraft] = useState<Filters>(initial);
    const [applied, setApplied] = useState<Filters>(initial);
    const set = (key: keyof Filters) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

    // Item picker: active items of the chosen metal (all metals when none).
    const items = useQuery({
        queryKey: [...itemQueryKey, { active: "Y", metalId: draft.metalId }],
        queryFn: () => fetchItems({ active: "Y", metalId: draft.metalId || undefined }),
        enabled: weightItems,
    });
    const itemList: Item[] = items.data?.items ?? [];
    const itemOptions = [{ value: "", label: "ALL ITEMS" }, ...itemList.map((i) => ({ value: String(i.itemId), label: i.itemName }))];
    // The report API filters by item name, so the picked item's name is sent.
    const [appliedItemName, setAppliedItemName] = useState("");
    const apply = () => {
        setAppliedItemName(itemList.find((i) => String(i.itemId) === draft.itemId)?.itemName ?? "");
        setApplied(draft);
    };

    const query = useQuery({
        queryKey: ["report", "weight", applied, appliedItemName, weightItems],
        queryFn: () => fetchWeightReport({
            fromDate: applied.fromDate,
            toDate: applied.toDate,
            tranType: applied.tranType,
            smithIds: applied.smithIds.map(Number),
            // Item and metal only apply when weight rows carry items (WEIGHTITEM = Y).
            itemId: weightItems ? applied.itemId : undefined,
            metalId: weightItems ? applied.metalId : undefined,
        }),
    });

    const columns = useMemo(() => {
        const all: (ReportColumn<WeightReportRow> & { itemOnly?: boolean })[] = [
            // Aggregate rows carry their label (SUBTOTAL / TOTAL / GRAND TOTAL) in itemName.
            { key: "date", label: "DATE", render: (r) => (r.resultSet === 1 ? formatReportDate(r.tranDate) : r.itemName) },
            { key: "metal", label: "METAL", itemOnly: true, render: (r) => r.metalName ?? r.metalId ?? "" },
            { key: "item", label: "ITEM", itemOnly: true, render: (r) => (r.resultSet === 1 ? r.itemName ?? "-" : "") },
            { key: "type", label: "TYPE", render: (r) => r.tranTypeName ?? r.tranType ?? "" },
            //{ key: "count", label: "COUNT", align: "right", render: (r) => r.transactionCount },
            { key: "grswt", label: "GRS WT", align: "right", itemOnly: true, render: (r) => wt(r.grswt) },
            { key: "touch", label: "TOUCH", align: "right", itemOnly: true, render: (r) => formatReportNumber(r.touch, 2) },
            { key: "issue", label: "ISSUE", align: "right", render: (r) => wt(r.issue) },
            { key: "receipt", label: "RECEIPT", align: "right", render: (r) => wt(r.receipt) },
            { key: "balance", label: "BALANCE", align: "right", render: (r) => wt(r.balance) },
        ];
        return all.filter((c) => weightItems || !c.itemOnly);
    }, [weightItems]);

    const subtitle = describeFilters([
        ["From", formatReportDate(applied.fromDate)],
        ["To", formatReportDate(applied.toDate)],
        ["Smiths", applied.smithIds.length ? `${applied.smithIds.length} selected` : undefined],
        ["Type", TYPE_OPTIONS.find((o) => o.value === applied.tranType && o.value)?.label],
        ["Item", weightItems && applied.itemId ? appliedItemName : undefined],
        ["Metal", weightItems ? applied.metalId : undefined],
    ]);

    return (
        <section className={card}>
            <CardHeader icon={Scale} title="WEIGHT TRANSACTION REPORT" subtitle="Weight issued and received, with subtotals by type" />
            <ReportFilterForm onSubmit={apply} onReset={() => { setDraft(initial()); setApplied(initial()); setAppliedItemName(""); }} busy={query.isFetching}>
                <FilterField label="FROM DATE" id="wr-from">
                    <DateInput id="wr-from" className={inputClass} value={draft.fromDate} onChange={set("fromDate")} maxDate={new Date()} />
                </FilterField>
                <FilterField label="TO DATE" id="wr-to">
                    <DateInput id="wr-to" className={inputClass} value={draft.toDate} onChange={set("toDate")} maxDate={new Date()} />
                </FilterField>
                <FilterField label="TYPE" id="wr-type">
                    <ComboBox id="wr-type" labelId="wr-type-label" value={draft.tranType} options={TYPE_OPTIONS}
                        placeholder="All types" onChange={set("tranType")} />
                </FilterField>
                <SmithFilter id="wr-smith" value={draft.smithIds} onChange={(smithIds) => setDraft((d) => ({ ...d, smithIds }))} />
                {weightItems && (
                    <>
                        <MetalFilter id="wr-metal" value={draft.metalId}
                            onChange={(metalId) => setDraft((d) => ({ ...d, metalId, itemId: "" }))} />
                        <FilterField label="ITEM" id="wr-item">
                            <ComboBox id="wr-item" labelId="wr-item-label" value={draft.itemId} options={itemOptions}
                                placeholder={items.isPending ? "Loading items…" : "All items"} onChange={set("itemId")} />
                        </FilterField>
                    </>
                )}
            </ReportFilterForm>
            <ReportTable title="Weight transaction report" subtitle={subtitle} columns={columns} rows={query.data ?? []}
                loading={query.isPending} error={query.isError ? getApiErrorMessage(query.error) : null} />
        </section>
    );
}
