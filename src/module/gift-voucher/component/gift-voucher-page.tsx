"use client";

import React, { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Users, TicketPlus, Undo2, BarChart3 } from "lucide-react";
import { IntroducerProvider } from "@/src/module/gift-voucher/context/introducer-context";
import IntroducerManager from "@/src/module/gift-voucher/component/introducer-manager";
import VoucherGenerateForm from "@/src/module/gift-voucher/component/voucher-generate-form";
import VoucherReturnForm from "@/src/module/gift-voucher/component/voucher-return-form";
import VoucherReport from "@/src/module/gift-voucher/component/voucher-report";

type TabKey = "introducers" | "issue" | "receipt" | "report";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "introducers", label: "Introducers", icon: <Users size={16} /> },
    { key: "issue", label: "Issue", icon: <TicketPlus size={16} /> },
    { key: "receipt", label: "Receipt", icon: <Undo2 size={16} /> },
    { key: "report", label: "Report", icon: <BarChart3 size={16} /> },
];

const GiftVoucherPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>("introducers");

    return (
        <IntroducerProvider>
            <Box className="p-2">
                <Typography
                    variant="h5"
                    className="font-semibold mb-3"
                    sx={{ fontSize: { xs: "1.1rem", md: "1.5rem" }, fontWeight: 700 }}
                >
                    Gift Voucher
                </Typography>

                <Paper elevation={0} className="mb-3 p-1 flex flex-wrap gap-1 border border-border rounded-lg w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "bg-[var(--primary-background-color)] text-white"
                                    : "text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </Paper>

                {activeTab === "introducers" && <IntroducerManager />}
                {activeTab === "issue" && <VoucherGenerateForm />}
                {activeTab === "receipt" && <VoucherReturnForm />}
                {activeTab === "report" && <VoucherReport />}
            </Box>
        </IntroducerProvider>
    );
};

export default GiftVoucherPage;
