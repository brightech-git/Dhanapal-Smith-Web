"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import Table, { TableColumn } from "@/component/ui/table/Table";
import VoucherPrinterSetup from "./VoucherPrinterSetup";
import { useIntroducers } from "@/context/giftVoucher/IntroducerContext";
import { useVoucherPrefixes } from "@/hooks/giftVoucher/useVoucherPrefixes";
import { useToast } from "@/context/smith/ToastContext";
import { useConfig } from "@/context/Config/ConfigContext";
import { VoucherService } from "@/service/voucherService";
import { GenerateVoucherRequest, Introducer, VoucherGeneration, VoucherPrefix } from "@/types/giftVoucher";
import { isPrinterConfigured, printVoucherTagsViaProtocol } from "@/service/giftVoucher/PrinterProtocolService";

const VoucherGenerateForm: React.FC = () => {
    const { activeIntroducers, fetchActive } = useIntroducers();
    const { data: prefixes = [], isLoading: prefixesLoading } = useVoucherPrefixes();
    const { addToast } = useToast();
    const config = useConfig();
    const companyName = config?.COMPANYNAME || config?.COMPANY_NAME || "Gift Voucher";

    const [introducersLoading, setIntroducersLoading] = useState(true);
    const [selectedIntroducer, setSelectedIntroducer] = useState<Introducer | null>(null);
    const [selectedPrefix, setSelectedPrefix] = useState<VoucherPrefix | null>(null);
    const [piece, setPiece] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [generated, setGenerated] = useState<VoucherGeneration[]>([]);

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

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedIntroducer) newErrors.introducer = "Introducer is required";
        // if (!selectedPrefix) newErrors.prefix = "Prefix is required";

        const pieceNum = Number(piece);
        if (!piece || isNaN(pieceNum) || pieceNum <= 0) {
            newErrors.piece = "Piece must be greater than 0";
        }

        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum < 0) {
            newErrors.amount = "Amount must be greater or equal than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const request: GenerateVoucherRequest = {
                introducerId: selectedIntroducer!.introducerId!,
                prefix: "GV",
                piece: Number(piece),
                amount: Number(amount),
            };

            console.log(request, 'request')

            const result = await VoucherService.generate(request);

            const enrichedResult: VoucherGeneration[] = result.map((voucher) => ({
                ...voucher,
                introducerName: selectedIntroducer!.introducerName,
                amount: Number(amount),
            }));

            console.log(enrichedResult, 'result');
            setGenerated(enrichedResult);

            addToast({
                type: "success",
                title: "Vouchers Issued",
                message: `${result.length} voucher(s) issued successfully`,
            });

            if (isPrinterConfigured()) {
                printVoucherTagsViaProtocol(enrichedResult, 1, companyName);
            } else {
                addToast({
                    type: "warning",
                    title: "Printer Not Set Up",
                    message: "Complete Tag Printer Setup above, then re-issue to print automatically.",
                });
            }

            setPiece("");
            setAmount("");
        } catch (error: any) {
            addToast({
                type: "error",
                title: "Error",
                message: error?.response?.data?.message || "Failed to issue vouchers",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const columns: TableColumn[] = useMemo(
        () => [
            {
                key: "sno",
                label: "S.No",
                align: "center",
                headalign: "center",
                width: "60px",
                render: (_v: any, _row: any, index: number) => <span className="font-semibold">{index + 1}</span>,
            },
            { key: "batchNo", label: "Batch No", align: "center", headalign: "center", width: "100px" },
            { key: "voucherCode", label: "Voucher Code", align: "left", headalign: "center", width: "160px" },
            { key: "voucherNo", label: "Voucher No", align: "center", headalign: "center", width: "120px" },
            { key: "introducerName", label: "Introducer", align: "left", headalign: "center", width: "160px" },
            { key: "amount", label: "Amount", align: "right", headalign: "center", width: "100px" },
        ],
        []
    );

    return (
        <Box className="p-2">
            <Typography
                variant="h6"
                className="font-semibold mb-3"
                sx={{ fontSize: { xs: "1rem", md: "1.3rem" }, fontWeight: 600 }}
            >
                Issue Vouchers
            </Typography>

            <VoucherPrinterSetup />

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

                        {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                        </Grid> */}

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Piece"
                                type="number"
                                value={piece}
                                onChange={(e) => {
                                    setPiece(e.target.value);
                                    if (errors.piece) setErrors((prev) => ({ ...prev, piece: "" }));
                                }}
                                error={!!errors.piece}
                                helperText={errors.piece}
                                disabled={submitting}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                                }}
                                error={!!errors.amount}
                                helperText={errors.amount}
                                disabled={submitting}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} className="flex justify-end">
                            <Button variant="contained" color="primary" type="submit" disabled={submitting}>
                                {submitting ? "Issuing..." : "Issue"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {generated.length > 0 && (
                <Table columns={columns} data={generated} showRows={0} fixedHeight="320px" />
            )}

        </Box>
    );
};

export default VoucherGenerateForm;
