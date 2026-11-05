"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Table from "@/src/components/ui/table";
import EditableCell from "@/src/components/ui/editable-cell";
import { useSmithDetails } from "@/src/module/smith/context/smith-details-context";
import { useToast } from "@/src/providers/toast-provider";
import { SmithDetails } from "@/src/module/smith/type/smith-details.types";
import { useSmithTransactionsContext } from "@/src/module/smith/context/smith-transactions-context";
import { motion } from "framer-motion";

type SmithManagerProps = {
    onSelectSmith?: (
        smithId: string | number,
        smithName?: string,
        showWeight?: boolean,
        showCash?: boolean
    ) => void;
};

const SmithManager: React.FC<SmithManagerProps> = ({ onSelectSmith }) => {
    const { smiths, fetchAll, updateSmith, deleteSmith } = useSmithDetails();
    const { transactions, getDetail, deleteTransaction } = useSmithTransactionsContext();
    const { addToast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    // 🔹 Fetch smiths
    useEffect(() => {
        let mounted = true;
        const loadSmiths = async () => {
            try {
                await fetchAll();
            } catch (error) {
                addToast({
                    type: "error",
                    title: "Error",
                    message: "Failed to fetch Smiths",
                });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadSmiths();
        return () => {
            mounted = false;
        };
    }, [fetchAll, addToast]);

    // 🔹 Save changes when edited
    const handleSave = async (
        smithId: number,
        key: keyof SmithDetails,
        newValue: any
    ) => {
        try {
            const existingSmith = smiths.find((s) => s.smithId === smithId);
            if (!existingSmith) return;

            const payload = {
                ...existingSmith,
                [key]: newValue,
            };

            await updateSmith(payload);
        } catch {
            addToast({
                type: "error",
                title: "Error",
                message: "Update failed.",
            });
            throw new Error("Update failed");
        }
    };

    // 🔹 Delete only if no nonzero transactions exist
    const handleDelete = async (smith: SmithDetails) => {
        const confirmDelete = confirm(`Delete ${smith.pname}?`);
        if (!confirmDelete) return;

        try {
            const detail = await getDetail(smith.smithId!);
            const hasAnyValue = Math.abs(detail.cashBalance) > 0.0001 || Math.abs(detail.weightBalance) > 0.0001;

            if (hasAnyValue) {
                addToast({
                    type: "warning",
                    title: "Cannot Delete",
                    message: `Sorry, ${smith.pname} cannot be deleted because they have an open cash or weight balance.`,
                });
                return;
            }

            // The backend needs a smith's transactions removed before the profile.
            for (const txn of detail.transactions) {
                await deleteTransaction(txn.id);
            }

            // Finally delete the smith itself
            await deleteSmith(smith.smithId!);

            addToast({
                type: "success",
                title: "Deleted",
                message: "Smith deleted successfully.",
            });
        } catch (error) {
            console.error("Delete failed:", error);
            addToast({
                type: "error",
                title: "Error",
                message: "Failed to delete Smith.",
            });
        }
    };

    // 🔹 Columns definition - SIMPLIFIED using EditableCell directly
    const columns = [
        {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            headalign: "center" as const,
            width: "60px",
            render: (_v: any, _row: any, index: number) => (
                <span className="font-semibold">{index + 1}</span>
            ),
        },
        {
            key: "pname",
            label: "Name",
            width: "150px",
            align: "left" as const,
            headalign: "center" as const,
            render: (value: any, row: SmithDetails) => (
                <EditableCell
                    value={value}
                    type="text"
                    onSave={async (newValue) => {
                        await handleSave(row.smithId!, "pname", newValue);
                    }}
                    className="w-full"
                />
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "center" as const,
            headalign: "center" as const,
            width: "80px",
            render: (_v: any, row: SmithDetails) => (
                <div className="flex justify-center">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </div>
            ),
        },
    ];

    // 🔹 Animated Table Display
    const visibleSmiths = showAll ? smiths : smiths.slice(0, 0);

    return (
        <Box className="p-2">
            <div className="flex justify-between items-center mb-2 gap-2">
                <Typography
                    variant="h6"
                    className="font-semibold"
                    sx={{
                        fontSize: { xs: "1rem", md: "1.3rem" },
                        fontWeight: 600,
                    }}
                >
                    Smith Management
                </Typography>

                {smiths.length > 0 && (
                    <div className="flex justify-center mt-2">
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setShowAll((prev) => !prev)}
                        >
                            {showAll ? "Show Less" : "Show All"}
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <CircularProgress />
                </div>
            ) : (
                <>
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {visibleSmiths.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Click "See All" to view and manage smiths
                            </div>
                        ) : (
                                    <Table columns={columns} data={visibleSmiths} showRows={10} fixedHeight={"300px"} />
                        )}
                    </motion.div>
                </>
            )}
        </Box>
    );
};

export default SmithManager;