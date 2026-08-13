import { describe, expect, test } from "bun:test";
import { executeV4 } from "./r032-lifecycle-v4";
describe("R032 lifecycle v4", () => {
  test("route policy behavior executes", () => {
    for (const r of executeV4()) {
      expect(r.routeBehavior.late.inherited).toBeTrue();
      expect(r.routeBehavior.overlay.source).toBe("overlay-override");
      expect(r.routeBehavior.unresolved.policy).toBe(
        r.adapter === "CAN-05" || r.adapter === "COM-03"
          ? "deny"
          : r.adapter === "CAN-03" ||
              r.adapter === "CAN-04" ||
              r.adapter === "COM-01" ||
              r.adapter === "COM-02"
            ? "privileged"
            : "ordinary",
      );
    }
  });
  test("reachability remains independent from caller authority", () => {
    for (const r of executeV4())
      for (const x of r.reachability) {
        expect(x.actualNetworkTested).toBeFalse();
        expect(x.callerAuthorityChanged).toBeFalse();
      }
  });
  test("clients and restart semantics execute", () => {
    for (const r of executeV4()) {
      for (const c of r.clientTransitions) {
        expect(c.final).toBe("ready");
        expect(c.trace.map((x: any) => x.event)).toEqual([
          "bootstrap",
          "disconnect",
          "reconnect",
          "expire",
          "recover",
          "revoke",
          "recover",
        ]);
      }
      if (r.restartSequence.controlled) {
        expect(r.restartSequence.stale.rootCalls).toBe(0);
        expect(r.restartSequence.missing.rootCalls).toBe(0);
      } else
        expect(r.restartSequence.stale.decision.reason).toBe(
          "ambient-authority-retained-gap",
        );
      expect(r.restartSequence.after.rootCalls).toBe(1);
    }
  });
});
