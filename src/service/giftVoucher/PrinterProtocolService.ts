// src/service/giftVoucher/PrinterProtocolService.ts
//
// Direct-to-printer flow for Gift Voucher tags, adapted from the RTM POS
// project's PrinterSetup.tsx + TagGeneration/page.tsx. No QZ Tray, no
// backend involved:
//
//   1. ONE-TIME SETUP: the user types their PC's System Name, the shared
//      printer's share name, and their Windows username. We generate and
//      download two files:
//        - a .reg file that registers a custom "giftvoucherprint://"
//          Windows protocol, pointing at a .bat file in Downloads
//        - a .bat file that waits for a label file to appear in Downloads,
//          then TYPEs it straight to the shared printer (\\System\Share)
//      The user double-clicks the .reg once (Yes to the UAC-style prompt)
//      and leaves the .bat sitting in their Downloads folder.
//
//   2. EVERY PRINT: we build raw printer-command text for the voucher
//      tag(s), download it as GiftVoucherPrint.txt (via a Blob), then
//      navigate to giftvoucherprint://launch. Windows resolves that
//      protocol to the .bat, which picks up the just-downloaded file and
//      sends it to the printer — no dialogs, no drivers, no QZ Tray.
import { VoucherGeneration } from "@/types/giftVoucher";

// ─── File / protocol names ──────────────────────────────────────────────
// Distinct from RTM POS's "myposbilling" so both apps can coexist on the
// same PC without the protocol registration clashing.
export const REG_FILENAME = "GiftVoucherPrint.reg";
export const BAT_FILENAME = "GiftVoucherPrint.BAT";
export const SRC_FILENAME = "GiftVoucherPrint.txt"; // downloaded by the browser
export const DEST_FILENAME = "GiftVoucherPrintOut.txt"; // working copy sent to the printer
export const PROTOCOL = "giftvoucherprint"; // giftvoucherprint://launch

// ─── Saved printer config (System Name / Printer Share / Windows Username) ──
const STORAGE_KEY = "giftVoucher.printerConfig";

export interface PrinterConfig {
    systemName: string;
    printerShare: string;
    windowsUsername: string;
}

export function getSavedPrinterConfig(): PrinterConfig {
    if (typeof window === "undefined") return { systemName: "", printerShare: "", windowsUsername: "" };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { systemName: "", printerShare: "", windowsUsername: "" };
        const parsed = JSON.parse(raw);
        return {
            systemName: parsed.systemName || "",
            printerShare: parsed.printerShare || "",
            windowsUsername: parsed.windowsUsername || "",
        };
    } catch {
        return { systemName: "", printerShare: "", windowsUsername: "" };
    }
}

export function savePrinterConfig(config: PrinterConfig): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isPrinterConfigured(): boolean {
    const { systemName, printerShare, windowsUsername } = getSavedPrinterConfig();
    return systemName.trim() !== "" && printerShare.trim() !== "" && windowsUsername.trim() !== "";
}

// ─── .reg content ────────────────────────────────────────────────────────
// The protocol handler is launched directly by Windows (not via cmd.exe),
// so %USERPROFILE% is never expanded — the Downloads path must be a literal
// absolute path built from the Windows username the user types in.
export function generateRegContent(username: string): string {
    return `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\${PROTOCOL}]
@="URL:GiftVoucherPrint Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\${PROTOCOL}\\shell\\open\\command]
@="\\"C:\\\\Users\\\\${username}\\\\Downloads\\\\${BAT_FILENAME}\\" \\"%1\\""
`;
}

// ─── .bat content ────────────────────────────────────────────────────────
// Both DOWNLOAD_PATH and DEST_PATH live in %USERPROFILE%\Downloads so no
// hardcoded personal path is needed here — works for any user once the
// .reg above points at their Downloads\GiftVoucherPrint.BAT.
export function generateBatContent(systemName: string, printerShare: string): string {
    const downloadPath = `%USERPROFILE%\\Downloads\\${SRC_FILENAME}`;
    const destPath = `%USERPROFILE%\\Downloads\\${DEST_FILENAME}`;
    const uncPath = `\\\\${systemName.trim()}\\${printerShare.trim()}`;

    return `@echo off
setlocal

REM Paths
set "DOWNLOAD_PATH=${downloadPath}"
set "DEST_PATH=${destPath}"

echo Waiting for ${SRC_FILENAME}...

REM Wait for file (max 15 sec)
set count=0
:waitloop
if exist "%DOWNLOAD_PATH%" goto movefile
timeout /t 1 >nul
set /a count+=1
if %count% GEQ 15 goto error
goto waitloop

:movefile
echo File found. Waiting for write completion...
timeout /t 2 >nul

echo Overwriting...

REM Delete old file
if exist "%DEST_PATH%" del "%DEST_PATH%"

REM Move new file -> overwrite
move "%DOWNLOAD_PATH%" "%DEST_PATH%"

echo Printing...

TYPE "%DEST_PATH%" > ${uncPath}

echo Done
exit

:error
echo File not found!
pause
exit
`;
}

// ─── Download helper ─────────────────────────────────────────────────────
export function downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadSetupFiles(config: PrinterConfig): void {
    downloadFile(generateRegContent(config.windowsUsername.trim()), REG_FILENAME);
    setTimeout(() => downloadFile(generateBatContent(config.systemName, config.printerShare), BAT_FILENAME), 300);
}

// ─── Raw label command generation ────────────────────────────────────────
// Same command language / label stock as RTM POS's tag printer (CAB-style
// raw commands, 25.1mm pitch, 4 labels packed per physical page). The
// printer's command set only supports a 1D barcode field (no QR), so the
// voucher code is printed as a Code128-style barcode instead of a QR code.
const EOL = "\r\n";

// X-offset table for the 4 label slots on one page.
const LABEL_OFFSETS = [
    { w: "00092", a: "0010", b: "0010", c: "0089", d: "0010" },
    { w: "01082", a: "0108", b: "0108", c: "0188", d: "0108" },
    { w: "02062", a: "0207", b: "0207", c: "0286", d: "0207" },
    { w: "03052", a: "0305", b: "0305", c: "0384", d: "0305" },
];

function buildPageHeader(): string {
    return (
        `<xpml><page quantity='0' pitch='25.1 mm'></xpml>` +
        `\u0002\u001BG0${EOL}` +
        `\u0002n${EOL}` +
        `\u0002M0500${EOL}` +
        `\u0002O0214${EOL}` +
        `\u0002V0${EOL}` +
        `\u0002\u001Bt1${EOL}` +
        `\u0002Kf0070${EOL}` +
        `<xpml></page></xpml><xpml><page quantity='1' pitch='25.1 mm'></xpml>` +
        `\u0002L${EOL}` +
        `D11${EOL}` +
        `A2${EOL}`
    );
}

function formatRupees(amount: number): string {
    return `Rs:${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Builds the raw printer-command text for the given vouchers, `copies`
 * labels per voucher, packing 4 labels per physical page (same layout as
 * RTM POS's tag printer).
 */
export function buildVoucherLabelContent(
    vouchers: VoucherGeneration[],
    copies: number = 1,
    companyName: string = "GIFT VOUCHER"
): string {
    type LabelEntry = { voucherCode: string; introducerName: string; amountText: string };

    const labelQueue: LabelEntry[] = [];
    for (const voucher of vouchers) {
        const entry: LabelEntry = {
            voucherCode: String(voucher.voucherCode || ""),
            introducerName: (voucher.introducerName || "").substring(0, 15),
            amountText: formatRupees(voucher.amount ?? 0),
        };
        for (let c = 0; c < Math.max(1, copies); c++) {
            labelQueue.push(entry);
        }
    }

    const header = buildPageHeader();
    const brand = companyName.substring(0, 15);

    let allContent = "";
    let idx = 0;
    while (idx < labelQueue.length) {
        const labelsInThisPage = Math.min(4, labelQueue.length - idx);
        allContent += header;

        for (let i = 0; i < labelsInThisPage; i++) {
            const lbl = labelQueue[idx + i];
            const off = LABEL_OFFSETS[i];
            // Barcode field — voucher code encoded as a 1D barcode.
            allContent += `1W1D330000050${off.w},LA,${lbl.voucherCode}${EOL}`;
            // Human-readable voucher code under the barcode.
            allContent += `1911C060039${off.a}${lbl.voucherCode}${EOL}`;
            // Introducer / customer name.
            allContent += `1911C050029${off.b}${lbl.introducerName}${EOL}`;
            // Brand / company name.
            allContent += `4911C050049${off.c}${brand}${EOL}`;
            // Amount.
            allContent += `1911C100003${off.d}${lbl.amountText}${EOL}`;
        }

        allContent += `Q0001${EOL}`;
        allContent += `E${EOL}`;
        allContent += `<xpml></page></xpml><xpml><end/></xpml>${EOL}`;
        idx += labelsInThisPage;
    }

    return allContent;
}

/**
 * Downloads the raw label file and triggers the registered
 * `giftvoucherprint://` protocol so the .bat picks it up and prints it.
 * Requires the one-time setup (see VoucherPrinterSetup) to already be done
 * on this computer.
 */
export function printVoucherTagsViaProtocol(
    vouchers: VoucherGeneration[],
    copies: number = 1,
    companyName?: string
): void {
    const content = buildVoucherLabelContent(vouchers, copies, companyName);
    downloadFile(content, SRC_FILENAME);
    setTimeout(() => {
        window.location.href = `${PROTOCOL}://launch`;
    }, 500);
}
