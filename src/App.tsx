import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { items, links, type Item, type Kind } from "./data";
import { recallCsv, report } from "./trace";

const COLUMNS: { kind: Kind; title: string }[] = [
  { kind: "lot", title: "Raw material lots" },
  { kind: "blend", title: "Blends" },
  { kind: "batch", title: "Finished batches" },
  { kind: "shipment", title: "Shipments" },
];

const number = (n: number) => n.toLocaleString("en-US");

function sentence(r: ReturnType<typeof report>): string {
  const { selected } = r;
  if (selected.kind === "shipment") {
    return `Shipment ${selected.id} went to ${selected.detail}. ${r.lots.length} raw material lots went into it. Pick one of them to see what else it touched.`;
  }
  const what = selected.kind === "lot" ? `Lot ${selected.id} (${selected.name.toLowerCase()})`
    : selected.kind === "blend" ? `Blend ${selected.id} (${selected.name.toLowerCase()})`
    : `Batch ${selected.id} (${selected.name.toLowerCase()})`;
  const batches = selected.kind === "batch" ? "" : ` is in ${r.batches.length} finished ${r.batches.length === 1 ? "batch" : "batches"} and`;
  return `${what}${batches} reached ${r.customers.length} ${r.customers.length === 1 ? "customer" : "customers"} in ${r.shipments.length} ${r.shipments.length === 1 ? "shipment" : "shipments"}. ${number(r.unitsShipped)} bottles have shipped. ${number(r.unitsOnHand)} are still in the warehouse and can be put on hold.`;
}

export default function App() {
  const [picked, setPicked] = useState("L-0732");
  const r = useMemo(() => report(picked, items, links), [picked]);
  const lit = useMemo(() => new Set([picked, ...r.up, ...r.down]), [picked, r]);

  // Lines between the columns are drawn from where the boxes actually are on screen.
  const board = useRef<HTMLDivElement>(null);
  const boxes = useRef(new Map<string, HTMLButtonElement>());
  const [paths, setPaths] = useState<{ key: string; d: string; from: string; to: string }[]>([]);

  const measure = () => {
    const root = board.current;
    if (!root) return;
    const origin = root.getBoundingClientRect();
    setPaths(links.flatMap((link) => {
      const a = boxes.current.get(link.from)?.getBoundingClientRect();
      const b = boxes.current.get(link.to)?.getBoundingClientRect();
      if (!a || !b) return [];
      const x1 = a.right - origin.left, y1 = a.top + a.height / 2 - origin.top;
      const x2 = b.left - origin.left, y2 = b.top + b.height / 2 - origin.top;
      const mid = (x1 + x2) / 2;
      return [{ key: `${link.from}>${link.to}`, from: link.from, to: link.to, d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}` }];
    }));
  };
  useLayoutEffect(measure, []);
  useEffect(() => {
    const watcher = new ResizeObserver(measure);
    if (board.current) watcher.observe(board.current);
    return () => watcher.disconnect();
  }, []);

  const download = () => {
    const url = URL.createObjectURL(new Blob([recallCsv(r)], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `recall-list-${r.selected.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPath = (from: string, to: string) => lit.has(from) && lit.has(to) &&
    (r.down.has(to) && (from === picked || r.down.has(from)) || r.up.has(from) && (to === picked || r.up.has(to)));

  return (
    <main className="page">
      <header className="head">
        <h1>Recall trace</h1>
        <p>If a raw material lot turns out to be bad, you need every batch it went into and every customer who received it, and you need it fast. Pick any lot, blend, batch or shipment. It traces in both directions.</p>
        <p className="note">All data here is made up.</p>
      </header>

      <section className="board-wrap" aria-label="Traceability map">
        <div className="board" ref={board}>
          <svg aria-hidden="true">
            {paths.map((p) => <path key={p.key} d={p.d} className={onPath(p.from, p.to) ? "on" : ""} />)}
          </svg>
          {COLUMNS.map((column) => (
            <div className="column" key={column.kind}>
              <h2>{column.title}</h2>
              {items.filter((item) => item.kind === column.kind).map((item: Item) => (
                <button
                  key={item.id}
                  type="button"
                  ref={(el) => { if (el) boxes.current.set(item.id, el); }}
                  className={`box${item.id === picked ? " picked" : lit.has(item.id) ? " lit" : " dim"}`}
                  aria-pressed={item.id === picked}
                  onClick={() => setPicked(item.id)}
                >
                  <b>{item.id}</b>
                  <span>{item.kind === "shipment" ? item.detail : item.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="result" aria-live="polite">
        <p className="summary">{sentence(r)}</p>

        {r.selected.kind === "shipment" ? (
          <table>
            <caption>Raw material lots behind {r.selected.id}</caption>
            <thead><tr><th>Lot</th><th>Material</th><th>Supplier</th><th>Received</th></tr></thead>
            <tbody>
              {r.lots.map((lot) => (
                <tr key={lot.id}><td><button type="button" className="link" onClick={() => setPicked(lot.id)}>{lot.id}</button></td><td>{lot.name}</td><td>{lot.detail}</td><td>{lot.date}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <table>
              <caption>Who to call, biggest exposure first</caption>
              <thead><tr><th>Customer</th><th>Shipments</th><th className="num">Bottles</th></tr></thead>
              <tbody>
                {r.customers.map((c) => (
                  <tr key={c.customer}><td>{c.customer}</td><td>{c.shipments.join(", ")}</td><td className="num">{number(c.units)}</td></tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="download" onClick={download}>Download the recall list (CSV)</button>
          </>
        )}
      </section>

      <footer className="foot">
        <a href="https://github.com/harshmarlecha04/recall-trace">Code on GitHub</a>
        <span>Built by Harsh Marlecha</span>
      </footer>
    </main>
  );
}
