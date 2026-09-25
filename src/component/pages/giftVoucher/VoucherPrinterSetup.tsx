"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Collapse,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Download, ChevronDown, ChevronUp, MonitorSmartphone, CheckCircle2 } from "lucide-react";
import {
    BAT_FILENAME,
    PROTOCOL,
    REG_FILENAME,
    SRC_FILENAME,
    downloadSetupFiles,
    getSavedPrinterConfig,
    isPrinterConfigured,
    savePrinterConfig,
} from "@/service/giftVoucher/PrinterProtocolService";

const VoucherPrinterSetup: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [systemName, setSystemName] = useState("");
    const [printerShare, setPrinterShare] = useState("");
    const [windowsUsername, setWindowsUsername] = useState("");
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        const saved = getSavedPrinterConfig();
        setSystemName(saved.systemName);
        setPrinterShare(saved.printerShare);
        setWindowsUsername(saved.windowsUsername);
        setDownloaded(isPrinterConfigured());
    }, []);

    const isValid = systemName.trim() !== "" && printerShare.trim() !== "" && windowsUsername.trim() !== "";

    const handleDownloadBoth = () => {
        if (!isValid) return;
        const config = { systemName: systemName.trim(), printerShare: printerShare.trim(), windowsUsername: windowsUsername.trim() };
        savePrinterConfig(config);
        downloadSetupFiles(config);
        setDownloaded(true);
    };

    const steps = [
        {
            num: "01",
            label: "Install Registry",
            detail: `Double-click ${REG_FILENAME} in your Downloads folder → click Yes to register the ${PROTOCOL}:// protocol in Windows.`,
        },
        {
            num: "02",
            label: "Keep BAT in Downloads",
            detail: `${BAT_FILENAME} must stay in C:\\Users\\${windowsUsername || "<username>"}\\Downloads — the registry entry points to that exact path.`,
        },
        {
            num: "03",
            label: "Verify Printer",
            detail: `Confirm \\\\${systemName || "YourPC"}\\${printerShare || "sharename"} is reachable and the label printer is online.`,
        },
        {
            num: "04",
            label: "Print",
            detail: `Click Print on an issued voucher — ${SRC_FILENAME} downloads automatically and the tag prints instantly.`,
        },
    ];

    return (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden", mb: 2 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1.2, cursor: "pointer" }}
                onClick={() => setOpen((p) => !p)}
            >
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <MonitorSmartphone size={18} />
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" fontWeight={700}>
                                Tag Printer Setup
                            </Typography>
                            <Chip
                                size="small"
                                label={downloaded ? "Ready" : "One-time Setup"}
                                color={downloaded ? "success" : "default"}
                                variant={downloaded ? "filled" : "outlined"}
                            />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Generate &amp; download {REG_FILENAME} and {BAT_FILENAME}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton size="small">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</IconButton>
            </Stack>

            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 2 }}>
                    <Grid container spacing={1.5} alignItems="flex-end">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="System / PC Name"
                                placeholder="e.g. Brightech2"
                                value={systemName}
                                onChange={(e) => setSystemName(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Printer Share Name"
                                placeholder="e.g. tvs"
                                value={printerShare}
                                onChange={(e) => setPrinterShare(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Windows Username"
                                placeholder="e.g. Admin"
                                value={windowsUsername}
                                onChange={(e) => setWindowsUsername(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                        <Button
                            variant="contained"
                            size="small"
                            disabled={!isValid}
                            onClick={handleDownloadBoth}
                            startIcon={downloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
                        >
                            {downloaded ? "Re-download Setup Files" : "Download Both"}
                        </Button>
                    </Stack>

                    {isValid && (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Printer UNC Path
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace" sx={{ mb: 1 }}>
                                {`\\\\${systemName.trim()}\\${printerShare.trim()}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Registered BAT Path
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                                {`C:\\Users\\${windowsUsername.trim()}\\Downloads\\${BAT_FILENAME}`}
                            </Typography>
                        </Box>
                    )}

                    <Grid container spacing={1.2} sx={{ mt: 0.5 }}>
                        {steps.map((step) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={step.num}>
                                <Stack direction="row" spacing={1.2} sx={{ p: 1.2, bgcolor: "action.hover", borderRadius: 1.5, height: "100%" }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 1,
                                            bgcolor: "var(--primary-background-color)",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 10,
                                            fontWeight: 800,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {step.num}
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} display="block">
                                            {step.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                            {step.detail}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};

export default VoucherPrinterSetup;
