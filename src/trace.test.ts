import { describe, expect, it } from "vitest";
import { items, links } from "./data";
import { downstream, recallCsv, report, upstream } from "./trace";

const ids = (set: Iterable<string>) => [...set].sort();

describe("the sample data", () => {
  it("has no link pointing at something that does not exist", () => {
    const known = new Set(items.map((i) => i.id));
    for (const link of links) {
      expect(known.has(link.from), link.from).toBe(true);
      expect(known.has(link.to), link.to).toBe(true);
    }
  });

  it("never ships more of a batch than was made", () => {
    for (const batch of items.filter((i) => i.kind === "batch")) {
      const shipped = links
        .filter((l) => l.from === batch.id)
        .reduce((sum, l) => sum + (items.find((i) => i.id === l.to)!.units ?? 0), 0);
      expect(shipped, batch.id).toBeLessThanOrEqual(batch.units!);
    }
  });

  it("gives every shipment exactly one batch", () => {
    for (const shipment of items.filter((i) => i.kind === "shipment")) {
      expect(links.filter((l) => l.to === shipment.id), shipment.id).toHaveLength(1);
    }
  });
});

describe("tracing forward", () => {
  it("follows a lot through a blend into batches and shipments", () => {
    // Melatonin only goes into the sleep premix, which goes into the two sleep gummy batches
    expect(ids(downstream("L-6052", links))).toEqual(
      ["B-2404", "B-2406", "BL-304", "S-3107", "S-3108", "S-3110", "S-3111"],
    );
  });

  it("counts a batch once even when the lot reaches it two ways", () => {
    // Zinc citrate reaches B-2405 directly, and B-2401 and B-2402 through the immune premix
    const down = downstream("L-3306", links);
    expect(ids([...down].filter((id) => id.startsWith("B-")))).toEqual(["B-2401", "B-2402", "B-2405"]);
  });

  it("finds nothing downstream of a shipment", () => {
    expect(downstream("S-3101", links).size).toBe(0);
  });
});

describe("tracing back", () => {
  it("finds every lot behind a shipment", () => {
    // S-3109 is zinc gummy from B-2405: gummy base BL-302 (pectin, tapioca), zinc citrate, berry flavor
    const up = upstream("S-3109", links);
    expect(ids([...up].filter((id) => id.startsWith("L-")))).toEqual(["L-2291", "L-3306", "L-4417", "L-8820"]);
    expect(up.has("B-2405")).toBe(true);
    expect(up.has("BL-302")).toBe(true);
  });

  it("finds nothing upstream of a raw material lot", () => {
    expect(upstream("L-2291", links).size).toBe(0);
  });
});

describe("the recall report", () => {
  it("adds up exposure for a lot used everywhere", () => {
    // Pectin is in both gummy bases, so it is in every finished batch
    const r = report("L-2291", items, links);
    expect(r.batches).toHaveLength(6);
    expect(r.shipments).toHaveLength(11);
    expect(r.unitsMade).toBe(21600);
    expect(r.unitsShipped).toBe(19400);
    expect(r.unitsOnHand).toBe(2200);
    expect(r.customers.map((c) => c.customer)).toEqual(
      // B and D tie on 4,000 bottles, so they go alphabetically, then C on 3,900
      ["Customer B", "Customer D", "Customer C", "Customer A", "Customer F", "Customer E"],
    );
  });

  it("groups shipments by customer", () => {
    const r = report("B-2401", items, links);
    expect(r.customers).toEqual([
      { customer: "Customer B", shipments: ["S-3102"], units: 2400 },
      { customer: "Customer A", shipments: ["S-3101"], units: 1800 },
    ]);
    expect(r.unitsOnHand).toBe(600);
  });

  it("lists the suspect lots for a complaint about one shipment", () => {
    const r = report("S-3110", items, links);
    expect(r.lots.map((l) => l.id)).toEqual(["L-1140", "L-2291", "L-6052", "L-8820"]);
    expect(r.shipments.map((s) => s.id)).toEqual(["S-3110"]);
    expect(r.batches).toHaveLength(0);
  });

  it("orders shipments oldest first", () => {
    const dates = report("L-4417", items, links).shipments.map((s) => s.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("rejects an id that does not exist", () => {
    expect(() => report("L-0000", items, links)).toThrow();
  });
});

describe("the CSV", () => {
  it("has a header and one row per shipment", () => {
    const csv = recallCsv(report("B-2403", items, links));
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe('"customer","shipment","product","shipped","units","traced_from"');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('"Customer D","S-3105","Vitamin C gummy","2026-09-04","2000","B-2403"');
  });
});
