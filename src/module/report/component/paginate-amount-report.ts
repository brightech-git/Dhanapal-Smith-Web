/** Fill A4 report pages top-to-bottom in the left column, then the right column. */
export function paginateAmountReport(document: Document, source: HTMLTableElement, header: HTMLElement) {
    let column: HTMLTableElement;
    let availableHeight = 0;
    let nextColumn: HTMLTableElement | null = null;

    const createTable = () => {
        const table = source.cloneNode(false) as HTMLTableElement;
        if (source.tHead) table.appendChild(source.tHead.cloneNode(true));
        table.createTBody();
        return table;
    };

    const startPage = () => {
        const page = document.createElement("section");
        page.className = "print-page";
        page.appendChild(header.cloneNode(true));
        const columns = document.createElement("div");
        columns.className = "print-columns";
        page.appendChild(columns);
        column = createTable();
        nextColumn = createTable();
        nextColumn.style.visibility = "hidden";
        columns.append(column, nextColumn);
        document.body.appendChild(page);
        availableHeight = page.getBoundingClientRect().bottom - columns.getBoundingClientRect().top - 4;
    };

    startPage();
    for (const row of Array.from(source.tBodies[0]?.rows ?? [])) {
        const copy = row.cloneNode(true) as HTMLTableRowElement;
        column!.tBodies[0].appendChild(copy);
        if (column!.getBoundingClientRect().height > availableHeight && column!.tBodies[0].rows.length > 1) {
            copy.remove();
            if (nextColumn) {
                column = nextColumn;
                column.style.visibility = "visible";
                nextColumn = null;
            } else {
                startPage();
            }
            column!.tBodies[0].appendChild(copy);
        }
    }
}
