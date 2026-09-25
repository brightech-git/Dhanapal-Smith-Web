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
// Same command language as RTM POS's tag printer, updated to the exact
// field-position codes and 15.1mm pitch confirmed working on the real
// hardware: one label per physical page, a text field showing the voucher
// code, and a 1D barcode encoding the same code (the printer's command
// language doesn't support QR, so a barcode is used instead).
const EOL = "\r\n";

// Fixed field-position codes (format code + offset) verified against a
// working sample print — see PrinterProtocolService docs/commit history
// for the raw sample this was derived from.
const TEXT_FIELD_PREFIX = "1911C100039"; // format code for the code text field
const TEXT_FIELD_OFFSET = "0030"; // y-position offset
const BARCODE_FIELD_PREFIX = "1W1D440000009"; // format code for the barcode field
const BARCODE_FIELD_OFFSET = "00600"; // y-position offset

function buildPageHeader(): string {
    return (
        `<xpml><page quantity='0' pitch='15.1 mm'></xpml>` +
        `\u0002\u001BG0${EOL}` +
        `\u0002n${EOL}` +
        `\u0002M0500${EOL}` +
        `\u0002O0214${EOL}` +
        `\u0002V0${EOL}` +
        `\u0002\u001Bt1${EOL}` +
        `\u0002Kf0070${EOL}` +
        `<xpml></page></xpml><xpml><page quantity='1' pitch='15.1 mm'></xpml>` +
        `\u0002L${EOL}` +
        `D11${EOL}` +
        `H19${EOL}` +
        `A2${EOL}`
    );
}

/**
 * Builds the raw printer-command text for the given vouchers, `copies`
 * labels per voucher — one voucher tag per physical page. Each tag has two
 * fields: the voucher code as text, and the same code as a barcode.
 */
export function buildVoucherLabelContent(vouchers: VoucherGeneration[], copies: number = 1): string {
    const labelQueue: string[] = [];
    for (const voucher of vouchers) {
        const voucherCode = String(voucher.voucherCode || "");
        for (let c = 0; c < Math.max(1, copies); c++) {
            labelQueue.push(voucherCode);
        }
    }

    const header = buildPageHeader();
    let allContent = "";

    for (const voucherCode of labelQueue) {
        allContent += header;
        allContent += `${TEXT_FIELD_PREFIX}${TEXT_FIELD_OFFSET}Coupon: ${voucherCode}${EOL}`;
        allContent += `${BARCODE_FIELD_PREFIX}${BARCODE_FIELD_OFFSET},LA,${voucherCode}${EOL}`;
        allContent += `Q0001${EOL}`;
        allContent += `E${EOL}`;
        allContent += `<xpml></page></xpml><xpml><end/></xpml>${EOL}`;
    }

    return allContent;
}

/**
 * Downloads the raw label file and triggers the registered
 * `giftvoucherprint://` protocol so the .bat picks it up and prints it.
 * Requires the one-time setup (see VoucherPrinterSetup) to already be done
 * on this computer.
 */
export function printVoucherTagsViaProtocol(vouchers: VoucherGeneration[], copies: number = 1): void {
    const content = buildVoucherLabelContent(vouchers, copies);
    downloadFile(content, SRC_FILENAME);
    setTimeout(() => {
        window.location.href = `${PROTOCOL}://launch`;
    }, 500);
}
