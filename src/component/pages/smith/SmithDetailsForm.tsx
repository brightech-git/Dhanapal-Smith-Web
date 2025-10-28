"use client";

import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Grid,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useSmithDetails } from "@/context/smith/useSmithDetails";
import { useToast } from "@/context/smith/ToastContext";
import { SmithDetails } from "@/types/smithDetails";

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const SmithDetailsForm: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("editId");

    const { fetchSmithById, createSmith, updateSmith } = useSmithDetails();
    const { addToast } = useToast();

    const [formData, setFormData] = useState<Partial<SmithDetails>>({ active: "Y" });
    const [errors, setErrors] = useState<Partial<Record<keyof SmithDetails, string>>>({});
    const [formLoading, setFormLoading] = useState(false); // for create/update
    const [fetchLoading, setFetchLoading] = useState(true); // for edit fetch

    // Fetch data in edit mode
    useEffect(() => {
        if (!editId) {
            setFetchLoading(false); // create mode
            return;
        }

        let mounted = true;

        const loadEditData = async () => {
            try {
                const data = await fetchSmithById(Number(editId));
                if (mounted) setFormData(data);
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to fetch Smith data" });
                router.push("/smiths");
            } finally {
                if (mounted) setFetchLoading(false);
            }
        };

        loadEditData();

        return () => {
            mounted = false;
        };
    }, [editId, fetchSmithById, addToast, router]);

    // Form validation
    const validateForm = (): boolean => {
        const requiredFields: (keyof SmithDetails)[] = ["pname"];
        const newErrors: Partial<Record<keyof SmithDetails, string>> = {};

        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = `${field.replace(/([A-Z])/g, " $1").trim()} is required`;
            }
        });

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setFormLoading(true);
        try {
            const submitData = { ...formData, active: formData.active || "Y" };
            if (editId && formData.smithId) {
                await updateSmith({ ...submitData, smithId: formData.smithId } as SmithDetails);
                addToast({ type: "success", title: "Updated", message: "Smith updated successfully" });
            } else {
                await createSmith(submitData);
                addToast({ type: "success", title: "Created", message: "Smith created successfully" });
            }
            router.push("/");
        } catch (error) {
            addToast({
                type: "error",
                title: "Error",
                message: `Failed to ${editId ? "update" : "create"} Smith`,
            });
        } finally {
            setFormLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/");
    };

    const handleChange = (field: keyof SmithDetails, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const renderTextField = (
        label: string,
        field: keyof SmithDetails,
        type: string = "text"
    ) => (
        <TextField
            fullWidth
            label={label}
            type={type}
            placeholder={`Enter ${label}`}
            value={formData[field] ?? ""}
            onChange={(e) =>
                handleChange(field, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)
            }
            variant="outlined"
            error={!!errors[field]}
            helperText={errors[field]}
            disabled={formLoading || fetchLoading}
            sx={{
                "& .MuiInputBase-input": {
                    color: "var(--primary-text-color)", // Input text color
                },
                "& .MuiInputLabel-root": {
                    color: "var(--primary-text-color)", // Label color
                },
                "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                        borderColor: "var(--primary-text-color)", // Border color
                    },
                    "&:hover fieldset": {
                        borderColor: "var(--primary-text-color)",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: "var(--primary-text-color)",
                    },
                },
                "& .MuiFormHelperText-root": {
                    color: "var(--primary-text-color)", // Helper/error text color
                },
            }}
        />

    );

    if (fetchLoading) {
        return (
            <Box className="flex justify-center items-center h-64">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="mx-auto p-6 shadow rounded ">
            <Typography variant="h5" gutterBottom>
                {editId ? "Edit Smith Details" : "Create Smith Details"}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Title", "title")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Initial", "initial")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Party Name", "pname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Middle Name", "mname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Sur Name", "sname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Door No", "doorno")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 1", "address1")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 2", "address2")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 3", "address3")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Area", "area")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("City", "city")}</Grid>

                   
                    {/* State */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <FormControl fullWidth error={!!errors.state}>
                            <InputLabel
                                id="state-label"
                                sx={{
                                    color: "var(--primary-text-color)", // Label color
                                    "&.Mui-focused": {
                                        color: "var(--primary-text-color)",
                                    },
                                }}
                            >
                                State
                            </InputLabel>

                            <Select
                                labelId="state-label"
                                label="State"
                                value={formData.state ?? ""}
                                onChange={(e) => handleChange("state", e.target.value)}
                                disabled={formLoading || fetchLoading}
                                sx={{
                                    "& .MuiSelect-select": {
                                        color: "var(--primary-text-color)", // Dropdown text color
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)", // Border color
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: "var(--primary-text-color)", // Dropdown arrow color
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <em>Select State</em>
                                </MenuItem>
                                {indianStates.map((state) => (
                                    <MenuItem key={state} value={state}>
                                        {state}
                                    </MenuItem>
                                ))}
                            </Select>

                            {errors.state && (
                                <FormHelperText sx={{ color: "var(--primary-text-color)" }}>
                                    {errors.state}
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>


                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Country", "country")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Pincode", "pincode")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Mobile", "mobile")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Email", "email")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("System ID", "systemid")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Cost ID", "costid")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("PAN", "pan")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("GST No", "gstno")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("State ID", "stateid", "number")}</Grid>

                    {/* Active */}
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel
                                id="active-label"
                                sx={{
                                    color: "var(--primary-text-color)", // Label color
                                    "&.Mui-focused": {
                                        color: "var(--primary-text-color)",
                                    },
                                }}
                            >
                                Active
                            </InputLabel>

                            <Select
                                labelId="active-label"
                                label="Active"
                                value={formData.active ?? "Y"}
                                onChange={(e) => handleChange("active", e.target.value)}
                                disabled={formLoading || fetchLoading}
                                sx={{
                                    "& .MuiSelect-select": {
                                        color: "var(--primary-text-color)", // Selected text color
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)", // Border color
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "var(--primary-text-color)",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: "var(--primary-text-color)", // Dropdown arrow color
                                    },
                                }}
                            >
                                <MenuItem value="Y">Yes</MenuItem>
                                <MenuItem value="N">No</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>


                    <Grid size={{ xs: 12 }} sx={{gap:1}} className="flex justify-end mt-3 space-x-2 g-2">
                        <Button variant="contained" color="primary" type="submit" disabled={formLoading || fetchLoading}>
                            {editId ? "Update Smith" : "Create Smith"}
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleCancel} disabled={formLoading || fetchLoading}>
                            Cancel
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default SmithDetailsForm;
