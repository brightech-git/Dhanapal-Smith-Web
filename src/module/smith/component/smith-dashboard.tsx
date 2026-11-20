"use client";

import { useState } from "react";
import { Activity, ClipboardList, History, IndianRupee, Scale, Users, Wallet } from "lucide-react";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";
import { useSoftControlFlags } from "../context/soft-control-context";
import { useDashboardSummary, useRecentCashTransactions, useRecentWeightTransactions } from "../hook/use-smith-dashboard";
import type { FlowKind, RecentTransaction } from "../type/smith-dashboard.types";
import { KpiCard, RecentTransactionsCard, SectionHeading, formatAmount, formatCount, formatWeight } from "./dashboard-widgets";
import TransactionDetailView from "./transaction-detail-view";
import FlowAttachmentsDialog from "./flow-attachments-dialog";
import DashboardGreeting from "./dashboard-greeting";

const pad = (n: number) => String(n).padStart(2, "0");

/** "dd-mm-yyyy hh:mm" for an ISO time, or null when it can't be read. */
const formatUpdated = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function SmithDashboardPage() {
    const { allDetails } = useAuth();
    const flags = useSoftControlFlags();
    const canViewTransactions = canViewMenu(allDetails, "transactions");
    const summaryQuery = useDashboardSummary(flags.showDashboard);
    const recentCashQuery = useRecentCashTransactions(5, flags.showDashboard && canViewTransactions);
    const recentWeightQuery = useRecentWeightTransactions(5, flags.showDashboard && canViewTransactions);

    const [detail, setDetail] = useState<{ kind: FlowKind; index: number } | null>(null);
    const [attachTarget, setAttachTarget] = useState<{ kind: FlowKind; row: Pick<RecentTransaction, "media" | "date"> & { id: number; remarks: string } } | null>(null);

    const summary = summaryQuery.data;
    const summaryLoading = flags.showLoading && summaryQuery.isLoading;
    const updated = formatUpdated(summary?.updatedAt);

    const dashboardSection = (
        <div className="space-y-4">
            {summaryQuery.isError && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
                    Unable to load dashboard totals. Please try again.
                </p>
            )}

            <SectionHeading
                title="Transaction overview"
                aside={
                    updated && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            Updated {updated}
                        </span>
                    )
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    index={0}
                    variant="hero"
                    className="xl:col-span-2"
                    label="Total weight balance"
                    value={summary?.totalWeight ?? null}
                    format={formatWeight}
                    footnote={summary ? `Across ${summary.weightTransactions} weight entries` : undefined}
                    icon={Scale}
                    tone="primary"
                    loading={summaryLoading}
                />
                <KpiCard
                    index={1}
                    variant="hero"
                    className="xl:col-span-2"
                    label="Total amount balance"
                    value={summary?.totalAmount ?? null}
                    format={formatAmount}
                    footnote={summary ? `Across ${summary.amountTransactions} cash entries` : undefined}
                    icon={IndianRupee}
                    tone="secondary"
                    loading={summaryLoading}
                />
                <KpiCard
                    index={2}
                    label="Smiths"
                    value={summary?.smithCount ?? null}
                    format={formatCount}
                    footnote="Registered smiths"
                    icon={Users}
                    tone="emerald"
                    loading={summaryLoading}
                />
                <KpiCard
                    index={3}
                    label="Weight transactions"
                    value={summary?.weightTransactions ?? null}
                    format={formatCount}
                    footnote="Gold received and issued"
                    icon={Scale}
                    tone="primary"
                    loading={summaryLoading}
                />
                <KpiCard
                    index={4}
                    label="Amount transactions"
                    value={summary?.amountTransactions ?? null}
                    format={formatCount}
                    footnote="Cash received and issued"
                    icon={IndianRupee}
                    tone="secondary"
                    loading={summaryLoading}
                />
                <KpiCard
                    index={5}
                    label="Total transactions"
                    value={summary?.totalTransactions ?? null}
                    format={formatCount}
                    icon={ClipboardList}
                    tone="slate"
                    loading={summaryLoading}
                    split={
                        summary
                            ? [
                                  { label: "Weight", value: summary.weightTransactions, color: "bg-primary" },
                                  { label: "Cash", value: summary.amountTransactions, color: "bg-secondary" },
                              ]
                            : undefined
                    }
                />
            </div>

            {canViewTransactions && (
                <>
                    <SectionHeading
                        title="Latest transactions"
                        aside={<Activity aria-hidden className="size-3.5 text-muted-foreground" />}
                    />
                    {(recentCashQuery.isError || recentWeightQuery.isError) && (
                        <p role="alert" className="text-sm text-muted-foreground">Some recent transactions could not be loaded.</p>
                    )}
                    <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                        <RecentTransactionsCard
                            index={0}
                            title="Recent cash transactions"
                            subtitle="Latest receipts and issues by amount"
                            icon={Wallet}
                            rows={recentCashQuery.data}
                            loading={flags.showLoading && recentCashQuery.isLoading}
                            format={formatAmount}
                            onSelect={(i) => setDetail({ kind: "cash", index: i })}
                            viewAllHref="/smiths/transactions"
                        />
                        <RecentTransactionsCard
                            index={1}
                            title="Recent weight transactions"
                            subtitle="Latest receipts and issues by weight"
                            icon={History}
                            rows={recentWeightQuery.data}
                            loading={flags.showLoading && recentWeightQuery.isLoading}
                            format={formatWeight}
                            onSelect={(i) => setDetail({ kind: "weight", index: i })}
                            viewAllHref="/smiths/transactions"
                        />
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-screen-2xl space-y-5 p-2 sm:p-4">
            <DashboardGreeting showSummary={flags.showDashboard} />
            {flags.showDashboard && dashboardSection}
            <TransactionDetailView
                open={!!detail}
                kind={detail?.kind ?? "cash"}
                rows={(detail?.kind === "weight" ? recentWeightQuery.data : recentCashQuery.data) ?? []}
                index={detail?.index ?? 0}
                format={detail?.kind === "weight" ? formatWeight : formatAmount}
                onIndexChange={(index) => setDetail((d) => (d ? { ...d, index } : d))}
                onClose={() => setDetail(null)}
                onAttach={(r) =>
                    detail && r.id !== undefined &&
                    setAttachTarget({
                        kind: detail.kind,
                        row: { id: r.id, date: r.date, remarks: r.remark, media: r.media },
                    })
                }
            />

            <FlowAttachmentsDialog
                open={!!attachTarget}
                kind={attachTarget?.kind ?? "cash"}
                row={attachTarget?.row ?? null}
                onClose={() => setAttachTarget(null)}
            />
        </div>
    );
}
