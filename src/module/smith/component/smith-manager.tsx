"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { Plus, Search, X } from "lucide-react";
import { SmithDetailsService } from "@/src/module/smith/api/smith-details.api";
import SmithFormModal from "./smith-form-modal";
import Table from "@/src/components/ui/table";
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
    const { smiths, fetchAll, deleteSmith } = useSmithDetails();
    const { getDetail, deleteTransaction } = useSmithTransactionsContext();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<SmithDetails[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const searchTerm = search.trim();
    const visibleSmiths = searchTerm ? searchResults : smiths;

    // Keep search results local so other smith selectors still have the full list.
    // Cleanup ignores late responses when the term changes or the component unmounts.
    useEffect(() => {
        let active = true;
        setSearchError(false);
        if (!searchTerm) {
            setSearchLoading(false);
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        const timer = setTimeout(async () => {
            try {
                const matches = await SmithDetailsService.getAll(searchTerm);
                if (active) setSearchResults(matches);
            } catch {
                if (active) {
                    setSearchResults([]);
                    setSearchError(true);
                }
            } finally {
                if (active) setSearchLoading(false);
            }
        }, 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [searchTerm, smiths]);
    // undefined = closed, null = new smith, a row = edit that smith
    const [formSmith, setFormSmith] = useState<SmithDetails | null | undefined>(undefined);

    // 🔹 Fetch smiths
    useEffect(() => {
        let mounted = true;
        const loadSmiths = async () => {
            try {
                await fetchAll();
            } catch {
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

    const selectSmith = (smith: SmithDetails) => {
        if (smith.smithId != null) onSelectSmith?.(smith.smithId, smith.pname, true, true);
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

    // 🔹 Smith list columns
    const columns = [
        {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            headalign: "center" as const,
            width: "60px",
            render: (_v: unknown, _row: SmithDetails, index: number) => (
                <span className="font-semibold">{index + 1}</span>
            ),
        },
        {
            key: "pname",
            label: "Name",
            width: "150px",
            align: "left" as const,
            headalign: "center" as const,
            render: (value: string, row: SmithDetails) => (
                <button
                    type="button"
                    className="w-full rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open cash and weight transactions for ${row.pname}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        selectSmith(row);
                    }}
                >
                    {value}
                </button>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "center" as const,
            headalign: "center" as const,
            width: "90px",
            render: (_v: unknown, row: SmithDetails) => (
                <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
                    <IconButton size="small" color="primary" aria-label={`Edit ${row.pname}`} onClick={() => setFormSmith(row)}>
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        aria-label={`Delete ${row.pname}`}
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

                <div className="mt-2 flex items-center gap-2">
                    <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setFormSmith(null)}>
                        Add smith
                    </Button>
                </div>
            </div>

            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <Search size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                    type="search"
                    aria-label="Search smiths by name"
                    placeholder="Search smith name..."
                    value={search}
                    maxLength={150}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                {search && (
                    <button type="button" aria-label="Clear smith search" onClick={() => setSearch("")}
                        className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                        <X size={16} />
                    </button>
                )}
            </div>

            {loading || searchLoading ? (
                <div className="flex justify-center items-center h-40">
                    <CircularProgress />
                </div>
            ) : searchError ? (
                <p role="alert" className="py-4 text-center text-sm text-red-600">
                    Could not search smiths. Please try again.
                </p>
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
                                {searchTerm ? "No matching smiths found." : "No smiths yet. Add a smith to get started."}
                            </div>
                        ) : (
                            <Table
                                columns={columns}
                                data={visibleSmiths}
                                onRowClick={selectSmith}
                                showRows={10}
                                fixedHeight="300px"
                            />
                        )}
                    </motion.div>
                </>
            )}
            <SmithFormModal open={formSmith !== undefined} smith={formSmith} onClose={() => setFormSmith(undefined)} />
        </Box>
    );
};

export default SmithManager;