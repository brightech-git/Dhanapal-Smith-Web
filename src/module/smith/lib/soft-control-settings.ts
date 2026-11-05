import type { SoftControl } from "../api/soft-control.api";

export type DashboardPosition = "above" | "below";

/** CTLID identifies the setting; CTLTEXT contains its value. */
export function readSoftControlSettings(controls: SoftControl[]) {
    const values = new Map(controls.map((control) => [
        (control.CTLID ?? "").trim().toUpperCase(),
        (control.CTLTEXT ?? "").trim().toUpperCase(),
    ]));
    const position = values.get("DASHBOARDPOSITION");
    return {
        grandTotal: values.get("GRANDTOTAL") === "Y",
        saveButton: values.get("SAVEBUTTON") === "Y",
        showDashboard: values.get("DASHBOARD") === "Y",
        showLoading: values.get("LOADING") === "Y",
        dashboardPosition: (position === "B" || position === "BELOW" || position === "BOTTOM"
            ? "below" : "above") as DashboardPosition,
    };
}
