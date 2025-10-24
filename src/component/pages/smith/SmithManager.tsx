"use client";

import React, { useEffect } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import Table from "@/component/ui/table/Table";
import { useSmithDetails } from "@/context/smith/useSmithDetails";
import { useToast } from "@/context/smith/ToastContext";
import { SmithDetails } from "@/types/smithDetails";

type SmithManagerProps = {
    onSelectSmith?: (smithId: string | number, smithName?: string, showWeight?: boolean, showCash?: boolean) => void;
};


const SmithManager: React.FC<SmithManagerProps> = ({ onSelectSmith }) => {
    const { smiths, fetchAll, deleteSmith } = useSmithDetails();
    const { addToast } = useToast();
    const router = useRouter();

    const [loading, setLoading] = React.useState(true);

    // Fetch all smiths on mount
    useEffect(() => {
        let mounted = true;
        const loadSmiths = async () => {
            try {
                await fetchAll();
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to fetch Smiths" });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadSmiths();
        return () => {
            mounted = false;
        };
    }, [fetchAll, addToast]);

    const handleSelectSmith = (smith: SmithDetails) => {
        if (onSelectSmith) {
            onSelectSmith(smith.smithId!, smith.pname, true, true);
        }
    };
    // Handlers
    const handleEdit = (smith: SmithDetails) => {
        router.push(`/smiths/create?editId=${smith.smithId}`);
    };

    const handleDelete = async (smith: SmithDetails) => {
        if (confirm(`Delete ${smith.pname}?`)) {
            try {
                await deleteSmith(smith.smithId!);
                addToast({ type: "success", title: "Deleted", message: "Smith deleted successfully" });
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to delete Smith" });
            }
        }
    };

    const handleCreate = () => {
        router.push("/smiths/create");
    };

    const columns = [
        {
            key: "sno",
            label: "S.No",
            align: "center" as const,
            width: "60px",
            render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
        },
        {
            key: "smithId", label: "ID", width: "70px",
            render: (_v: any, row: SmithDetails) => (
                <span
                    className="cursor-pointer text-blue-600"
                    onDoubleClick={() => handleSelectSmith(row)}
                    onClick={() => handleSelectSmith(row)} // optional for mobile tap
                >
                    {row.smithId}
                </span>
            )
        },
        { key: "pname", label: "Name", width: "150px" },
        { key: "mobile", label: "Mobile" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "active", label: "Active" },
    ];

    return (
        <Box className="p-2">
            <div className="flex justify-between items-center mb-2">
                <Typography variant="h6" className="font-semibold" sx={{fontSize:{xs:'1rem',md:'1.3rem' } ,fontWeight:600}}>
                    Smith Management
                </Typography>
                <Button variant="contained" color="primary" onClick={handleCreate}>
                    Add Smith
                </Button>
            </div>

                <Table
                    columns={columns}
                    data={smiths}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions
                    emptyMessage="No Smiths available"
                    showRows={5}
                />
            
        </Box>
    );
};

export default SmithManager;
