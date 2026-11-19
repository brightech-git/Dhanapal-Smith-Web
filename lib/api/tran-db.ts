// Transaction database (period) selection. Transaction, dashboard and report
// requests send the selected database in the tranDb request header.

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

/** A row of GET /dbmaster. type T = transactions; closed Y = read-only period. */
export type TranDatabase = {
    dbname: string;
    dbtype: string;
    startdate: string | null;
    enddate: string | null;
    closed: string | null;
    userid: number | null;
};

const STORAGE_KEY = "smith.tranDb";
/** Requests that need tranDb: transactions, the dashboard and the transaction reports. */
const NEEDS_TRAN_DB = /^\/?(transactions?(\/|$|\?)|report\/transaction(\/|$|\?))/;

let selected: string | null = null;
let loading: Promise<string | null> | null = null;
const listeners = new Set<(name: string | null) => void>();

const read = () => {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const write = (name: string | null) => {
    try {
        if (name) sessionStorage.setItem(STORAGE_KEY, name);
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage blocked: the choice lasts until the page reloads.
    }
};

export const getTranDb = () => selected ?? (selected = read());

/** Picks a period (e.g. a closed earlier year to view). Pass null to go back to the current one. */
export function setTranDb(name: string | null) {
    selected = name;
    write(name);
    listeners.forEach((listener) => listener(name));
}

export function onTranDbChange(listener: (name: string | null) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/** Unwraps the {success, message, data} envelope without importing envelope.ts (it imports the client). */
const dataOf = <T,>(body: unknown) => (body && typeof body === "object" && "data" in body ? (body as { data: T }).data : body as T);

/** The open period for today (GET /dbmaster/current), fetched once. */
export function loadCurrentTranDb(client: AxiosInstance): Promise<string | null> {
    if (!loading) {
        loading = client.get("dbmaster/current", { params: { type: "T" } })
            .then((response) => dataOf<TranDatabase>(response.data)?.dbname ?? null)
            .catch(() => null)
            .then((name) => {
                if (name && !getTranDb()) setTranDb(name);
                return name;
            });
        // Allow a retry later if it failed (e.g. not logged in yet).
        loading.then((name) => { if (!name) loading = null; });
    }
    return loading;
}

export const fetchTranDatabases = async (client: AxiosInstance) =>
    (dataOf<TranDatabase[]>((await client.get("dbmaster")).data) ?? []).filter((db) => (db.dbtype ?? "T") === "T");

/** Adds the tranDb header to transaction requests, loading the current period first if needed. */
export function attachTranDb(client: AxiosInstance) {
    client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
        const url = config.url ?? "";
        if (!NEEDS_TRAN_DB.test(url)) return config;
        const name = getTranDb() ?? await loadCurrentTranDb(client);
        if (name) config.headers.set("tranDb", name);
        return config;
    });
}
