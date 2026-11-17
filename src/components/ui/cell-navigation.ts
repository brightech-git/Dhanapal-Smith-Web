// Enter-to-next-cell for editable tables (cash and weight transactions).
// Mark each cell control with data-cell-nav; add data-cell-edit to cells that
// open an editor when clicked (EditableCell). Enter saves the current cell and
// opens the next one in the row, then the first one of the next row.

const CELL = "[data-cell-nav]";
const FOCUSABLE = "input:not([type=hidden]):not([tabindex='-1']), select, textarea, button, [tabindex]:not([tabindex='-1'])";

type Position = { body: Element; row: number; cell: number };

const visible = (el: Element) => !!((el as HTMLElement).offsetWidth || (el as HTMLElement).offsetHeight);
const cellsOf = (row: Element | undefined) => (row ? Array.from(row.querySelectorAll<HTMLElement>(CELL)).filter(visible) : []);

/** Where the next cell is, worked out before the current cell saves and re-renders. */
export function nextCellPosition(from: Element): Position | null {
    const row = from.closest("tr");
    const body = row?.parentElement;
    if (!row || !body) return null;
    const index = cellsOf(row).findIndex((cell) => cell.contains(from));
    if (index < 0) return null;
    return { body, row: Array.from(body.children).indexOf(row), cell: index + 1 };
}

/** Opens or focuses the cell at a position (the next row's first cell when the row ends). */
export function activateCell(position: Position | null) {
    if (!position) return false;
    const rows = position.body.children;
    let target = cellsOf(rows[position.row])[position.cell];
    for (let r = position.row + 1; !target && r < rows.length; r++) target = cellsOf(rows[r])[0];
    if (!target) return false;
    if (target.hasAttribute("data-cell-edit")) target.click();
    else (target.matches(FOCUSABLE) ? target : target.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return true;
}

/** Moves from a cell control to the next cell once the current change has rendered. */
export function moveToNextCell(from: Element) {
    const position = nextCellPosition(from);
    if (!position) return false;
    requestAnimationFrame(() => activateCell(position));
    return true;
}
