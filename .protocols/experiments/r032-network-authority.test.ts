import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { candidates, collect, hardGates } from "./r032-network-authority";

const repositoryRoot = resolve(import.meta.dir, "../..");
const fixturePath = resolve(
    repositoryRoot,
    ".protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/route-control-reconciliation.json",
);

describe("R-032 symmetric network-authority prototypes", () => {
    test("every frozen candidate and combination receives identical committed and synthetic cases", async () => {
        const routes = JSON.parse(await readFile(fixturePath, "utf8"));
        expect(routes).toHaveLength(36);
        const expected = collect(candidates[0]!, routes).map(row => `${row.axis}/${row.caseId}`);
        expect(expected).toHaveLength(407);

        for (const candidate of candidates) {
            const rows = collect(candidate, routes);
            expect(rows.map(row => `${row.axis}/${row.caseId}`)).toEqual(expected);
            expect(rows.filter(row => row.axis === "immediate")).toHaveLength(36 * 8);
            expect(rows.filter(row => row.axis === "deferred")).toHaveLength(9 * 6);
            expect(rows.filter(row => row.axis === "route-lifecycle")).toHaveLength(36 + 3);
            expect(JSON.stringify(rows)).not.toContain("synthetic-r032-bearer-never-serialize");
        }
    });

    test("formula rows encode expected locality/separation distinctions but are not evidence", async () => {
        const routes = JSON.parse(await readFile(fixturePath, "utf8"));
        for (const id of ["CAN-01", "CAN-02", "CAN-05", "CAN-06"] as const) {
            const candidate = candidates.find(item => item.id === id)!;
            const gates = hardGates(candidate, collect(candidate, routes));
            expect(gates["GATE-01"].pass).toBeFalse();
            expect(gates["GATE-02"].pass).toBeFalse();
            expect(gates["GATE-04"].pass).toBeTrue();
        }
    });

    test("formula rows encode expected authority-bearing outcomes but do not execute adapters", async () => {
        const routes = JSON.parse(await readFile(fixturePath, "utf8"));
        for (const id of ["CAN-03", "CAN-04", "COM-01", "COM-02", "COM-03"] as const) {
            const candidate = candidates.find(item => item.id === id)!;
            const gates = hardGates(candidate, collect(candidate, routes));
            expect(Object.values(gates).every(gate => gate.pass)).toBeTrue();
        }
    });
});
