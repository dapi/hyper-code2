import { describe, expect, test } from "bun:test";
import { executeV5 } from "./r032-committed-route-v5";

describe("R032 committed route v5", () => {
    test("executes committed registration, override, match and intercepted dispatch", async () => {
        for (const row of await executeV5()) {
            expect(row.committedPath.loadedEntryCount).toBe(36);
            expect(row.committedPath.actualOverrideReplacedHandler).toBeTrue();
            expect(row.committedPath.loaderAuthorityPolicyField).toBeFalse();
            expect(row.dispatchPath.requestedHostname).toBe("0.0.0.0");
            expect(row.dispatchPath.matchedAndDispatched).toBeTrue();
            expect(row.dispatchPath.handlerCalls).toBe(1);
        }
    });

    test("keeps four reachability records independent from caller authority", async () => {
        for (const row of await executeV5()) {
            expect(row.reachability.map((x) => x.case)).toEqual(["default-locality", "explicit-non-local-request", "peer-address-metadata", "recovery"]);
            for (const reach of row.reachability) {
                expect(reach.actualNetworkTested).toBeFalse();
                expect(reach.callerAuthorityChanged).toBeFalse();
            }
        }
    });

    test("couples browser and cli lifecycle to candidate authorization", async () => {
        for (const row of await executeV5()) {
            for (const client of row.clients) {
                expect(client.transitions.map((x) => x.event)).toEqual(["start", "reconnect", "expiry", "expiry-recovery", "revocation", "revocation-recovery"]);
                const expiry = client.transitions.find((x) => x.event === "expiry")!;
                const recovery = client.transitions.find((x) => x.event === "expiry-recovery")!;
                expect(recovery.decision.allow).toBeTrue();
                if (["CAN-03", "CAN-04", "COM-01", "COM-02", "COM-03"].includes(row.adapter)) expect(expiry.decision.allow).toBeFalse();
            }
        }
    });

    test("records retained authority across restart symmetrically", async () => {
        const rows = await executeV5();
        expect(rows.map((x) => x.adapter)).toEqual(["CAN-01", "CAN-02", "CAN-03", "CAN-04", "CAN-05", "CAN-06", "COM-01", "COM-02", "COM-03"]);
        for (const row of rows) {
            expect(row.routeCases).toHaveLength(4);
            for (const routeCase of row.routeCases) expect(routeCase.bypassObserved).toBe(routeCase.missing.allow);
            expect(row.restart.fresh.rootCalls).toBe(1);
            if (row.restart.controlled) {
                expect(row.restart.stale.rootCalls).toBe(0);
                expect(row.restart.missing.rootCalls).toBe(0);
            }
        }
    });
});
