// src/utils/qrSvg.ts
import { qrcode } from "@/lib/qrcode-generator";

/**
 * Builds an SVG markup string for a QR code encoding `value`.
 * `sizePx` is the rendered width/height of the square SVG in CSS px.
 */
export function buildQrSvg(value: string, sizePx: number = 160): string {
    const qr = qrcode(0, "M"); // typeNumber 0 = auto-detect smallest size
    qr.addData(value);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = sizePx / moduleCount;

    let pathData = "";
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                const x = col * cellSize;
                const y = row * cellSize;
                pathData += `M${x},${y}h${cellSize}v${cellSize}h${-cellSize}z`;
            }
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}" shape-rendering="crispEdges"><rect width="${sizePx}" height="${sizePx}" fill="#ffffff"/><path d="${pathData}" fill="#000000"/></svg>`;
}

/**
 * Same as buildQrSvg but returns a data: URL, handy for <img src=...>.
 */
export function buildQrDataUrl(value: string, sizePx: number = 160): string {
    const svg = buildQrSvg(value, sizePx);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
