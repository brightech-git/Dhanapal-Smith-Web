"use client";

import React, { useState } from "react";
import { BarChart3, TicketPlus, Undo2, Users } from "lucide-react";
import IntroducerManager from "./introducer-manager";
import VoucherGenerateForm from "./voucher-generate-form";
import VoucherReturnForm from "./voucher-return-form";
import VoucherReport from "./voucher-report";

type TabKey = "issue" | "receipt" | "introducers" | "report";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "issue", label: "Issue", icon: TicketPlus },
    { key: "receipt", label: "Receipt", icon: Undo2 },
    { key: "introducers", label: "Introducers", icon: Users },
    { key: "report", label: "Report", icon: BarChart3 },
];

/** Gift voucher: issue tags (amount and pcs), receive them back, introducers and a report. */
export default function GiftVoucherPage() {
    const [active, setActive] = useState<TabKey>("issue");

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Gift Voucher</h1>
                <p className="text-sm text-muted-foreground">Issue gift tags with amount and pcs, receive them back, and track what is pending.</p>
            </div>

            <nav className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm" role="tablist">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active === key}
                        onClick={() => setActive(key)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                            active === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </nav>

            {active === "issue" && <VoucherGenerateForm />}
            {active === "receipt" && <VoucherReturnForm />}
            {active === "introducers" && <IntroducerManager />}
            {active === "report" && <VoucherReport />}
        </div>
    );
}
