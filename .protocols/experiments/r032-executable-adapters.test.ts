import { describe, expect, test } from "bun:test";
import { adapters, executeAdapter } from "./r032-executable-adapters";

describe("R-032 bounded executable adapters", () => {
    test("all nine adapters execute the same representative cells", () => {
        const expected=executeAdapter(adapters[0]!).map(row=>`${row.axis}:${row.case}`);
        expect(expected).toHaveLength(19);
        for(const adapter of adapters) expect(executeAdapter(adapter).map(row=>`${row.axis}:${row.case}`)).toEqual(expected);
    });
    test("raw sentinel is absent after each adapter sink projection", () => {
        for(const adapter of adapters){const row=executeAdapter(adapter).find(row=>row.axis==="non-transit")!;expect(row.rawInjected).toBeTrue();expect(row.detected).toBeFalse();expect(Object.values(row.sinkCounts)).toEqual([0,0,0,0,0,0]);}
    });
    test("failures and mechanism gaps remain visible", () => {
        const loopback=executeAdapter(adapters.find(a=>a.id==="CAN-01")!);
        expect(loopback.find(r=>r.case==="privileged:missing")!.authorityRootCalls).toBe(1);
        const auth=executeAdapter(adapters.find(a=>a.id==="CAN-03")!);
        expect(auth.find(r=>r.case==="privileged:missing")!.authorityRootCalls).toBe(0);
        expect(auth.find(r=>r.case==="use:revoked")!.authorityRootCalls).toBe(0);
    });
});
