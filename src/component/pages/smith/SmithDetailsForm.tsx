// src/components/SmithDetailsForm.tsx
"use client";

import React, { useState } from "react";
import { TextField, Button, Grid, Typography, Box } from "@mui/material";
import { useSmithDetails } from "@/context/smith/useSmithDetails";
import { SmithDetails } from "@/types/smithDetails";

const SmithDetailsForm = () => {
    const { createSmith } = useSmithDetails();
    const [formData, setFormData] = useState<Partial<SmithDetails>>({});
    const [response, setResponse] = useState<SmithDetails | null>(null);

    const handleChange = (field: keyof SmithDetails, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const created = await createSmith(formData);
        setResponse(created);
        setFormData({}); // reset form
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
        />
    );

    return (
        <Box className=" mx-auto p-6 shadow rounded bg-white">
            <Typography variant="h4" component="h2" gutterBottom>
                Create Smith
            </Typography>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={1} >
                    {renderTextField("Title", "title") && <Grid size={{xs:12 ,sm:6 ,md:2}}>{renderTextField("Title", "title")}</Grid>}
                    <Grid size={{xs:12 ,sm:4 ,md:2}} >{renderTextField("Initial", "initial")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Party Name", "pname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Middle Name", "mname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Sur Name", "sname")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Door No", "doorno")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 1", "address1")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 2", "address2")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Address 3", "address3")}</Grid>
                    <Grid size={{ xs: 12, sm: 4 , md: 2 }}>{renderTextField("Area", "area")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("City", "city")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("State", "state")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Country", "country")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Pincode", "pincode")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Mobile", "mobile")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Email", "email")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("System ID", "systemid")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Cost ID", "costid")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("PAN", "pan")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("GST No", "gstno")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("State ID", "stateid", "number")}</Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>{renderTextField("Active", "active")}</Grid>

                    <Grid size={{ xs: 12}} className="flex justify-end mt-1">
                        <Button variant="contained" color="primary" type="submit">
                            Create Smith
                        </Button>
                    </Grid>
                </Grid>
            </form>

            {response && (
                <Box className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                    <Typography variant="h6" className="text-green-800">
                        Smith Created Successfully!
                    </Typography>
                    <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
                </Box>
            )}
        </Box>
    );
};

export default SmithDetailsForm;
