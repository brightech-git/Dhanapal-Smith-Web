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
import Table from "@/component/ui/table/Table";
import EditableCell from "@/component/ui/EditableCell";
import { useSmithDetails } from "@/context/smith/useSmithDetails";
import { useToast } from "@/context/smith/ToastContext";
import { SmithDetails } from "@/types/smithDetails";
import { useSmithTransactionsContext } from "@/context/smith/SmithTransactionsContext";

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
    const { transactions, deleteTransaction, getDetail } =
        useSmithTransactionsContext();
    const { addToast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);

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
            addToast({
                type: "success",
                title: "Updated",
                message: `${key} updated successfully.`,
            });
            setEditingId(null); // Exit edit mode
        } catch {
            addToast({
                type: "error",
                title: "Error",
                message: "Update failed.",
            });
        }
    };

    // 🔹 Enable editing mode
    const handleEditStart = (smithId: number) => {
        setEditingId(smithId);
    };

    // 🔹 Exit editing mode
    const handleEditEnd = () => {
        setEditingId(null);
    };

    // 🔹 Delete only if no nonzero transactions exist
    const handleDelete = async (smith: SmithDetails) => {
        const confirmDelete = confirm(`Delete ${smith.pname}?`);
        if (!confirmDelete) return;

        try {
            const smithDetails = await getDetail(smith.smithId!);
            console.log("Smith details:", smithDetails);

            const smithTxns = transactions.filter(
                (txn) => txn.smithId === smith.smithId!.toString()
            );

            const hasAnyValue = smithTxns.some(
                (txn) =>
                    (parseFloat(String(txn.cashBalance || 0)) !== 0 &&
                        !isNaN(parseFloat(String(txn.cashBalance || 0)))) ||
                    (parseFloat(String(txn.weightBalance || 0)) !== 0 &&
                        !isNaN(parseFloat(String(txn.weightBalance || 0))))
            );

            if (hasAnyValue) {
                addToast({
                    type: "warning",
                    title: "Cannot Delete",
                    message: `Sorry, ${smith.pname} cannot be deleted because they have existing transactions.`,
                });
                return;
            }

            for (const txn of smithTxns) {
                await deleteTransaction(txn.id);
            }

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

    // 🔹 Columns definition
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
            render: (value: any, row: SmithDetails) =>
                editingId === row.smithId ? (
                    <EditableCell
                        value={value}
                        type="text"
                        onSave={(newValue) => handleSave(row.smithId!, "pname", newValue)}
                        onBlur={handleEditEnd}
                        autoFocus
                    />
                ) : (
                    <div
                        onDoubleClick={() => handleEditStart(row.smithId!)}
                        className="cursor-pointer hover:text-blue-600 transition-colors px-2 py-1 rounded"
                        title="Double-click to edit"
                    >
                        {row.pname}
                    </div>
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

    return (
        <Box className="p-2">
            <div className="flex justify-between items-center mb-2">
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
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <CircularProgress />
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={smiths}
                    emptyMessage="No Smiths available"
                    showRows={5}
                />
            )}
        </Box>
    );
};

export default SmithManager;