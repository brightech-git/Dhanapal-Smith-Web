"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Typography,
    Grid,
    TextField,
    Autocomplete,
    Paper,
    CircularProgress,
} from "@mui/material";
import { useIntroducers } from "@/context/giftVoucher/IntroducerContext";
import { useVoucherPrefixes } from "@/hooks/giftVoucher/useVoucherPrefixes";
import { useToast } from "@/context/smith/ToastContext";
import { VoucherService } from "@/service/voucherService";
import { Introducer, ReturnVoucherRequest, VoucherPrefix } from "@/types/giftVoucher";

const parseVoucherNos = (raw: string): number[] => {
    return raw
        .split(/[\s,]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => Number(part))
        .filter((num) => !isNaN(num));
};

const VoucherReturnForm: React.FC = () => {
    const { activeIntroducers, fetchActive } = useIntroducers();
    const { data: prefixes = [], isLoading: prefixesLoading } = useVoucherPrefixes();
    const { addToast } = useToast();

    const [introducersLoading, setIntroducersLoading] = useState(true);
    const [selectedIntroducer, setSelectedIntroducer] = useState<Introducer | null>(null);
    const [selectedPrefix, setSelectedPrefix] = useState<VoucherPrefix | null>(null);
    const [batchNo, setBatchNo] = useState<string>("");
    const [voucherNosRaw, setVoucherNosRaw] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await fetchActive();
            } catch (error) {
                addToast({ type: "error", title: "Error", message: "Failed to fetch Introducers" });
            } finally {
                if (mounted) setIntroducersLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validate = (voucherNos: number[]): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedIntroducer) newErrors.introducer = "Introducer is required";
        if (!selectedPrefix) newErrors.prefix = "Prefix is required";

        const batchNum = Number(batchNo);
        if (!batchNo || isNaN(batchNum) || batchNum <= 0) {
            newErrors.batchNo = "Batch No is required";
        }

        if (voucherNos.length === 0) {
            newErrors.voucherNos = "Enter at least one voucher number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const voucherNos = parseVoucherNos(voucherNosRaw);
        if (!validate(voucherNos)) return;

        setSubmitting(true);
        try {
            const request: ReturnVoucherRequest = {
                batchNo: Number(batchNo),
                introducerId: selectedIntroducer!.introducerId!,
                prefix: selectedPrefix!.prefix,
                voucherNos,
            };

            await VoucherService.returnVoucher(request);

            addToast({
                type: "success",
                title: "Vouchers Returned",
                message: `${voucherNos.length} voucher(s) returned successfully`,
            });

            setBatchNo("");
            setVoucherNosRaw("");
        } catch (error: any) {
            addToast({
                type: "error",
                title: "Error",
                message: error?.response?.data?.message || "Failed to return vouchers",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box className="p-2">
            <Typography
                variant="h6"
                className="font-semibold mb-3"
                sx={{ fontSize: { xs: "1rem", md: "1.3rem" }, fontWeight: 600 }}
            >
                Return Vouchers
            </Typography>

            <Paper elevation={1} className="p-3 mb-3">
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Autocomplete
                                options={activeIntroducers}
                                getOptionLabel={(option) => option.introducerName}
                                value={selectedIntroducer}
                                onChange={(_e, newValue) => {
                                    setSelectedIntroducer(newValue);
                                    if (errors.introducer) setErrors((prev) => ({ ...prev, introducer: "" }));
                                }}
                                loading={introducersLoading}
                                disabled={submitting}
                                size="small"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Introducer"
                                        error={!!errors.introducer}
                                        helperText={errors.introducer}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {introducersLoading ? (
                                                        <CircularProgress color="inherit" size={16} />
                                                    ) : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Autocomplete
                                options={prefixes}
                                getOptionLabel={(option) => option.prefix}
                                value={selectedPrefix}
                                onChange={(_e, newValue) => {
                                    setSelectedPrefix(newValue);
                                    if (errors.prefix) setErrors((prev) => ({ ...prev, prefix: "" }));
                                }}
                                loading={prefixesLoading}
                                disabled={submitting}
                                size="small"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Prefix"
                                        error={!!errors.prefix}
                                        helperText={errors.prefix}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {prefixesLoading ? (
                                                        <CircularProgress color="inherit" size={16} />
                                                    ) : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Batch No"
                                type="number"
                                value={batchNo}
                                onChange={(e) => {
                                    setBatchNo(e.target.value);
                                    if (errors.batchNo) setErrors((prev) => ({ ...prev, batchNo: "" }));
                                }}
                                error={!!errors.batchNo}
                                helperText={errors.batchNo}
                                disabled={submitting}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Voucher Numbers"
                                placeholder="e.g. 1001, 1002, 1003"
                                value={voucherNosRaw}
                                onChange={(e) => {
                                    setVoucherNosRaw(e.target.value);
                                    if (errors.voucherNos) setErrors((prev) => ({ ...prev, voucherNos: "" }));
                                }}
                                error={!!errors.voucherNos}
                                helperText={errors.voucherNos || "Comma or space separated"}
                                disabled={submitting}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} className="flex justify-end">
                            <Button variant="contained" color="primary" type="submit" disabled={submitting}>
                                {submitting ? "Returning..." : "Return"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default VoucherReturnForm;
