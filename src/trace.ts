// The tracing logic. No React in here, so it can be tested on its own.

import type { Item, Link } from "./data";

/** Everything reachable from `start` by following links in one direction. Does not include `start`. */
function reach(start: string, links: Link[], direction: "down" | "up"): Set<string> {
  const next = new Map<string, string[]>();
  for (const link of links) {
    const [key, value] = direction === "down" ? [link.from, link.to] : [link.to, link.from];
    if (!next.has(key)) next.set(key, []);
    next.get(key)!.push(value);
  }
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    for (const id of next.get(current) ?? []) {
      if (!seen.has(id)) {       // the same blend can be reached two ways; count it once
        seen.add(id);
        queue.push(id);
      }
    }
  }
  return seen;
}

/** Where it went: every blend, batch and shipment that contains `id`. */
export function downstream(id: string, links: Link[]): Set<string> {
  return reach(id, links, "down");
}

/** Where it came from: every lot, blend and batch that went into `id`. */
export function upstream(id: string, links: Link[]): Set<string> {
  return reach(id, links, "up");
}

export interface CustomerLine {
  customer: string;
  shipments: string[];
  units: number;
}

export interface Report {
  selected: Item;
  up: Set<string>;
  down: Set<string>;
  lots: Item[];               // raw material lots that went into the selection
  batches: Item[];            // finished batches affected, including the selection if it is one
  shipments: Item[];          // shipments affected, oldest first
  customers: CustomerLine[];  // who to call, biggest exposure first
  unitsMade: number;
  unitsShipped: number;
  unitsOnHand: number;        // made but not shipped, so still in the warehouse and can be put on hold
}

/** Everything needed to act on a problem with one lot, blend, batch or shipment. */
export function report(id: string, items: Item[], links: Link[]): Report {
  const byId = new Map(items.map((item) => [item.id, item]));
  const selected = byId.get(id);
  if (!selected) throw new Error(`No item with id ${id}`);

  const up = upstream(id, links);
  const down = downstream(id, links);
  const affected = new Set([id, ...down]);
  const pick = (ids: Iterable<string>, kind: Item["kind"]) =>
    [...ids].map((x) => byId.get(x)!).filter((item) => item.kind === kind);

  const batches = pick(affected, "batch").sort((a, b) => a.id.localeCompare(b.id));
  const shipments = pick(affected, "shipment").sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const lots = pick(new Set([id, ...up]), "lot").sort((a, b) => a.id.localeCompare(b.id));

  const lines = new Map<string, CustomerLine>();
  for (const shipment of shipments) {
    const line = lines.get(shipment.detail) ?? { customer: shipment.detail, shipments: [], units: 0 };
    line.shipments.push(shipment.id);
    line.units += shipment.units ?? 0;
    lines.set(shipment.detail, line);
  }
  const customers = [...lines.values()].sort((a, b) => b.units - a.units || a.customer.localeCompare(b.customer));

  // Units on hand only make sense for whole batches. For a single shipment, the question is that shipment.
  const unitsMade = batches.reduce((sum, batch) => sum + (batch.units ?? 0), 0);
  const shippedFromBatches = batches.reduce((sum, batch) => {
    const out = links.filter((l) => l.from === batch.id).map((l) => byId.get(l.to)!);
    return sum + out.reduce((s, shipment) => s + (shipment.units ?? 0), 0);
  }, 0);
  const unitsShipped = shipments.reduce((sum, shipment) => sum + (shipment.units ?? 0), 0);

  return {
    selected, up, down, lots, batches, shipments, customers,
    unitsMade,
    unitsShipped,
    unitsOnHand: Math.max(0, unitsMade - shippedFromBatches),
  };
}

/** The call list as CSV text, one row per shipment. */
export function recallCsv(r: Report): string {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = ["customer", "shipment", "product", "shipped", "units", "traced_from"];
  const rows = r.shipments.map((s) => [s.detail, s.id, s.name, s.date, s.units ?? 0, r.selected.id]);
  return [header, ...rows].map((row) => row.map(quote).join(",")).join("\n") + "\n";
}
