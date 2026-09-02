"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    IconButton,
    TextField,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Collapse,
} from "@mui/material";
import { Delete, Edit, Add, Close } from "@mui/icons-material";
import Table, { TableColumn } from "@/component/ui/table/Table";
import { useIntroducers } from "@/context/giftVoucher/IntroducerContext";
import { useToast } from "@/context/smith/ToastContext";
import { Introducer } from "@/types/giftVoucher";
import { getAxiosInstance } from "@/api/axiosInstance";

const emptyForm: Partial<Introducer> = {
    introducerName: "",
    email: "",
    mobile: "",
    address: "",
    isActive: true,
};

const IntroducerManager: React.FC = () => {
    const { introducers, loading, fetchAll, createIntroducer, updateIntroducer, deleteIntroducer } =
        useIntroducers();
    const { addToast } = useToast();

    const [initialLoading, setInitialLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Introducer>>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof Introducer, string>>>({});
    const [submitting, setSubmitting] = useState(false);

  

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await fetchAll();
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to fetch Introducers" });
            } finally {
                if (mounted) setInitialLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (field: keyof Introducer, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Introducer, string>> = {};

        if (!formData.introducerName || !formData.introducerName.trim()) {
            newErrors.introducerName = "Introducer Name is required";
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const openCreateForm = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setErrors({});
        setShowForm(true);
    };

    const openEditForm = (introducer: Introducer) => {
        setEditingId(introducer.introducerId ?? null);
        setFormData(introducer);
        setErrors({});
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            if (editingId) {
                await updateIntroducer(editingId, formData);
                addToast({ type: "success", title: "Updated", message: "Introducer updated successfully" });
            } else {
                await createIntroducer(formData);
                addToast({ type: "success", title: "Created", message: "Introducer created successfully" });
            }
            closeForm();
        } catch (error) {
            addToast({
                type: "error",
                title: "Error",
                message: `Failed to ${editingId ? "update" : "create"} Introducer`,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (introducer: Introducer) => {
        const confirmDelete = confirm(`Delete introducer "${introducer.introducerName}"?`);
        if (!confirmDelete) return;

        try {
            await deleteIntroducer(introducer.introducerId!);
            addToast({ type: "success", title: "Deleted", message: "Introducer deleted successfully" });
        } catch (error) {
            addToast({ type: "error", title: "Error", message: "Failed to delete Introducer" });
        }
    };

    const columns: TableColumn[] = [
        {
            key: "sno",
            label: "S.No",
            align: "center",
            headalign: "center",
            width: "60px",
            render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
        },
        {
            key: "introducerName",
            label: "Introducer Name",
            align: "left",
            headalign: "center",
            width: "180px",
        },
        {
            key: "email",
            label: "Email",
            align: "left",
            headalign: "center",
            width: "180px",
            render: (value: any) => value || "-",
        },
        {
            key: "mobile",
            label: "Mobile",
            align: "left",
            headalign: "center",
            width: "130px",
            render: (value: any) => value || "-",
        },
        {
            key: "address",
            label: "Address",
            align: "left",
            headalign: "center",
            width: "220px",
            render: (value: any) => value || "-",
        },
        {
            key: "isActive",
            label: "Active",
            align: "center",
            headalign: "center",
            width: "90px",
            render: (value: any) => (
                <span className={value ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {value ? "Yes" : "No"}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            headalign: "center",
            width: "90px",
            render: (_v: any, row: Introducer) => (
                <div className="flex justify-center gap-1">
                    <IconButton size="small" color="primary" onClick={() => openEditForm(row)}>
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                        <Delete fontSize="small" />
                    </IconButton>
                </div>
            ),
        },
    ];

    return (
        <Box className="p-2">
            <div className="flex justify-between items-center mb-3 gap-2">
                <Typography
                    variant="h6"
                    className="font-semibold"
                    sx={{ fontSize: { xs: "1rem", md: "1.3rem" }, fontWeight: 600 }}
                >
                    Introducers
                </Typography>

                <Button
                    variant={showForm ? "outlined" : "contained"}
                    size="small"
                    color={showForm ? "secondary" : "primary"}
                    startIcon={showForm ? <Close /> : <Add />}
                    onClick={() => (showForm ? closeForm() : openCreateForm())}
                >
                    {showForm ? "Close" : "Add Introducer"}
                </Button>
            </div>

            <Collapse in={showForm} unmountOnExit>
                <Paper elevation={1} className="p-3 mb-3">
                    <Typography variant="subtitle1" className="font-medium mb-2">
                        {editingId ? "Edit Introducer" : "New Introducer"}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Introducer Name"
                                    value={formData.introducerName ?? ""}
                                    onChange={(e) => handleChange("introducerName", e.target.value)}
                                    error={!!errors.introducerName}
                                    helperText={errors.introducerName}
                                    disabled={submitting}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Email"
                                    value={formData.email ?? ""}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    disabled={submitting}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Mobile"
                                    value={formData.mobile ?? ""}
                                    onChange={(e) => handleChange("mobile", e.target.value)}
                                    error={!!errors.mobile}
                                    helperText={errors.mobile}
                                    disabled={submitting}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="introducer-active-label">Active</InputLabel>
                                    <Select
                                        labelId="introducer-active-label"
                                        label="Active"
                                        value={formData.isActive ? "Y" : "N"}
                                        onChange={(e) => handleChange("isActive", e.target.value === "Y")}
                                        disabled={submitting}
                                    >
                                        <MenuItem value="Y">Yes</MenuItem>
                                        <MenuItem value="N">No</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Address"
                                    value={formData.address ?? ""}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    disabled={submitting}
                                    multiline
                                    minRows={2}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }} className="flex justify-end gap-2">
                                <Button variant="contained" color="primary" type="submit" disabled={submitting}>
                                    {editingId ? "Update Introducer" : "Save Introducer"}
                                </Button>
                                <Button variant="outlined" color="secondary" onClick={closeForm} disabled={submitting}>
                                    Cancel
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Collapse>

            {initialLoading ? (
                <div className="flex justify-center items-center h-40">
                    <CircularProgress />
                </div>
            ) : (
                <Table columns={columns} data={introducers} showRows={0} fixedHeight="420px" loading={loading && !initialLoading} />
            )}
        </Box>
    );
};

export default IntroducerManager;
