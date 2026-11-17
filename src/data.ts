// Made-up traceability data for an invented gummy supplement maker.
// Nothing here comes from a real company. The shapes match db/schema.sql.

export type Kind = "lot" | "blend" | "batch" | "shipment";

export interface Item {
  id: string;
  kind: Kind;
  name: string;        // material or product
  detail: string;      // supplier, stage, or customer
  date: string;        // received, made, or shipped (YYYY-MM-DD)
  units?: number;      // bottles made (batch) or bottles shipped (shipment)
}

export interface Link {
  from: string;        // what was used or shipped
  to: string;          // what it went into
}

export const items: Item[] = [
  // raw material lots, as received
  { id: "L-2291", kind: "lot", name: "Pectin", detail: "Supplier 1", date: "2026-08-03" },
  { id: "L-1140", kind: "lot", name: "Citric acid", detail: "Supplier 2", date: "2026-08-05" },
  { id: "L-8820", kind: "lot", name: "Tapioca syrup", detail: "Supplier 3", date: "2026-08-06" },
  { id: "L-0732", kind: "lot", name: "Elderberry extract", detail: "Supplier 4", date: "2026-08-10" },
  { id: "L-5518", kind: "lot", name: "Vitamin C", detail: "Supplier 2", date: "2026-08-11" },
  { id: "L-3306", kind: "lot", name: "Zinc citrate", detail: "Supplier 5", date: "2026-08-12" },
  { id: "L-6052", kind: "lot", name: "Melatonin", detail: "Supplier 5", date: "2026-08-14" },
  { id: "L-4417", kind: "lot", name: "Berry flavor", detail: "Supplier 6", date: "2026-08-17" },

  // blends made from those lots, used in more than one finished batch
  { id: "BL-301", kind: "blend", name: "Gummy base", detail: "Blend", date: "2026-08-19" },
  { id: "BL-302", kind: "blend", name: "Gummy base", detail: "Blend", date: "2026-08-26" },
  { id: "BL-303", kind: "blend", name: "Immune premix", detail: "Blend", date: "2026-08-20" },
  { id: "BL-304", kind: "blend", name: "Sleep premix", detail: "Blend", date: "2026-08-27" },

  // finished batches, in bottles
  { id: "B-2401", kind: "batch", name: "Elderberry gummy", detail: "Finished", date: "2026-08-24", units: 4800 },
  { id: "B-2402", kind: "batch", name: "Elderberry gummy", detail: "Finished", date: "2026-08-31", units: 4800 },
  { id: "B-2403", kind: "batch", name: "Vitamin C gummy", detail: "Finished", date: "2026-08-25", units: 3600 },
  { id: "B-2404", kind: "batch", name: "Sleep gummy", detail: "Finished", date: "2026-09-01", units: 3000 },
  { id: "B-2405", kind: "batch", name: "Zinc gummy", detail: "Finished", date: "2026-09-02", units: 2400 },
  { id: "B-2406", kind: "batch", name: "Sleep gummy", detail: "Finished", date: "2026-08-28", units: 3000 },

  // shipments to customers
  { id: "S-3101", kind: "shipment", name: "Elderberry gummy", detail: "Customer A", date: "2026-09-02", units: 1800 },
  { id: "S-3102", kind: "shipment", name: "Elderberry gummy", detail: "Customer B", date: "2026-09-03", units: 2400 },
  { id: "S-3103", kind: "shipment", name: "Elderberry gummy", detail: "Customer C", date: "2026-09-08", units: 3000 },
  { id: "S-3104", kind: "shipment", name: "Elderberry gummy", detail: "Customer A", date: "2026-09-10", units: 1200 },
  { id: "S-3105", kind: "shipment", name: "Vitamin C gummy", detail: "Customer D", date: "2026-09-04", units: 2000 },
  { id: "S-3106", kind: "shipment", name: "Vitamin C gummy", detail: "Customer B", date: "2026-09-09", units: 1600 },
  { id: "S-3107", kind: "shipment", name: "Sleep gummy", detail: "Customer E", date: "2026-09-11", units: 1500 },
  { id: "S-3108", kind: "shipment", name: "Sleep gummy", detail: "Customer C", date: "2026-09-12", units: 900 },
  { id: "S-3109", kind: "shipment", name: "Zinc gummy", detail: "Customer F", date: "2026-09-14", units: 2400 },
  { id: "S-3110", kind: "shipment", name: "Sleep gummy", detail: "Customer D", date: "2026-09-05", units: 2000 },
  { id: "S-3111", kind: "shipment", name: "Sleep gummy", detail: "Customer E", date: "2026-09-15", units: 600 },
];

export const links: Link[] = [
  // lots into blends
  { from: "L-2291", to: "BL-301" }, { from: "L-1140", to: "BL-301" }, { from: "L-8820", to: "BL-301" },
  { from: "L-2291", to: "BL-302" }, { from: "L-8820", to: "BL-302" },
  { from: "L-0732", to: "BL-303" }, { from: "L-5518", to: "BL-303" }, { from: "L-3306", to: "BL-303" },
  { from: "L-6052", to: "BL-304" }, { from: "L-1140", to: "BL-304" },

  // blends, and a few lots added directly, into finished batches
  { from: "BL-301", to: "B-2401" }, { from: "BL-303", to: "B-2401" }, { from: "L-4417", to: "B-2401" },
  { from: "BL-302", to: "B-2402" }, { from: "BL-303", to: "B-2402" }, { from: "L-4417", to: "B-2402" },
  { from: "BL-301", to: "B-2403" }, { from: "L-5518", to: "B-2403" },
  { from: "BL-302", to: "B-2404" }, { from: "BL-304", to: "B-2404" },
  { from: "BL-302", to: "B-2405" }, { from: "L-3306", to: "B-2405" }, { from: "L-4417", to: "B-2405" },
  { from: "BL-301", to: "B-2406" }, { from: "BL-304", to: "B-2406" },

  // finished batches out the door
  { from: "B-2401", to: "S-3101" }, { from: "B-2401", to: "S-3102" },
  { from: "B-2402", to: "S-3103" }, { from: "B-2402", to: "S-3104" },
  { from: "B-2403", to: "S-3105" }, { from: "B-2403", to: "S-3106" },
  { from: "B-2404", to: "S-3107" }, { from: "B-2404", to: "S-3108" },
  { from: "B-2405", to: "S-3109" },
  { from: "B-2406", to: "S-3110" }, { from: "B-2406", to: "S-3111" },
];
