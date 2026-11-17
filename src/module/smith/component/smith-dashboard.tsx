"use client";

import { useState } from "react";
import { ClipboardList, History, IndianRupee, Scale, Users, Wallet } from "lucide-react";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canViewMenu } from "@/src/features/auth/lib/access";
import { useSoftControlFlags } from "../context/soft-control-context";
import { useDashboardSummary, useRecentCashTransactions, useRecentWeightTransactions } from "../hook/use-smith-dashboard";
import type { FlowKind, RecentTransaction } from "../type/smith-dashboard.types";
import { KpiCard, RecentTransactionsCard, formatAmount, formatWeight } from "./dashboard-widgets";
import TransactionDetailView from "./transaction-detail-view";
import FlowAttachmentsDialog from "./flow-attachments-dialog";
import DashboardGreeting from "./dashboard-greeting";

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
    const dashboardSection = (
        <div className="space-y-2">
            {summaryQuery.isError && <p role="alert" className="text-sm text-red-600">Unable to load dashboard totals. Please try again.</p>}
            <h2 className="text-lg font-semibold">Transaction overview</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <KpiCard
                    index={0}
                    label="Total weight balance"
                    value={summary?.totalWeight ?? null}
                    format={formatWeight}
                    footnote={summary ? `${summary.weightTransactions} weight entries` : undefined}
                    icon={Scale}
                    tone="primary"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
                <KpiCard
                    index={1}
                    label="Total amount"
                    value={summary?.totalAmount ?? null}
                    format={formatAmount}
                    footnote={summary ? `${summary.amountTransactions} cash entries` : undefined}
                    icon={IndianRupee}
                    tone="secondary"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
                <KpiCard
                    index={2}
                    label="Smiths"
                    value={summary?.smithCount ?? null}
                    format={(v) => Math.round(v).toString()}
                    footnote="Registered smiths"
                    icon={Users}
                    tone="emerald"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
                <KpiCard
                    index={3}
                    label="Weight transactions"
                    value={summary?.weightTransactions ?? null}
                    format={(v) => Math.round(v).toLocaleString("en-IN")}
                    icon={Scale}
                    tone="primary"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
                <KpiCard
                    index={4}
                    label="Amount transactions"
                    value={summary?.amountTransactions ?? null}
                    format={(v) => Math.round(v).toLocaleString("en-IN")}
                    icon={IndianRupee}
                    tone="secondary"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
                <KpiCard
                    index={5}
                    label="Total transactions"
                    value={summary?.totalTransactions ?? null}
                    format={(v) => Math.round(v).toLocaleString("en-IN")}
                    icon={ClipboardList}
                    tone="slate"
                    loading={flags.showLoading && summaryQuery.isLoading}
                />
            </div>

            {canViewTransactions && <h2 className="text-md font-semibold">Latest transactions</h2>}
            {canViewTransactions && (recentCashQuery.isError || recentWeightQuery.isError) && (
                <p role="alert" className="text-sm text-muted-foreground">Some recent transactions could not be loaded.</p>
            )}
            {canViewTransactions && <div className="grid grid-cols-1 gap-2">
                <RecentTransactionsCard
                    index={0}
                    title="Recent cash transactions"
                    subtitle="Latest receipts and issues by amount"
                    icon={Wallet}
                    rows={recentCashQuery.data}
                    loading={flags.showLoading && recentCashQuery.isLoading}
                    format={formatAmount}
                    onSelect={(i) => setDetail({ kind: "cash", index: i })}
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
                />
            </div>}
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-screen-2xl space-y-4 p-2 sm:p-3">
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
