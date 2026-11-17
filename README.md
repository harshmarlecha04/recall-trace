# Recall trace

**Live: https://harshmarlecha04.github.io/recall-trace/**

If a raw material lot turns out to be bad, a manufacturer has to answer three questions quickly: which batches did it go into, which customers received those batches, and how much is still in the building. In a lot of plants that answer lives in binders and spreadsheets, and getting it takes hours.

This is a small app that answers it in one click. Pick any raw material lot, blend, finished batch or shipment and it traces in both directions:

- **Forward**, from a lot to every blend, batch, shipment and customer it reached.
- **Back**, from a customer complaint about one shipment to every lot that went into it.

For anything upstream of a shipment it also gives the call list (customers ranked by how many bottles they received), how many bottles are still in the warehouse and can be put on hold, and a CSV of the list to hand to whoever makes the calls.

All of the data is made up. I work in supplement manufacturing, where this kind of trace is a routine part of the job, and I built this to show the idea without using anything real.

## What makes it more than a lookup

Ingredients do not go straight into finished product. A lot goes into a blend, the blend goes into several batches, and the same lot can reach one batch by two routes. Zinc citrate here goes into one batch directly and into two more through a premix.

So the trace has to walk the whole chain, as many levels as there are, and count each thing once however many ways it was reached. That logic is in `src/trace.ts`, about a hundred lines with no screen code in it, and it is what the tests cover.

## The same trace in a database

The app reads its sample data from a file so that it runs with no server. Real traceability data sits in a database, so `db/` has the same thing for Postgres, which is what Supabase runs:

- `db/schema.sql` creates the two tables: items, and links between them.
- `db/seed.sql` loads the sample data.
- `db/trace.sql` has the forward trace, the backward trace and the call list as recursive queries.

The queries are standard SQL and return the same results as the app's tracing code on the sample data.

## Run it yourself

You need Node 18 or newer.

```
npm install
npm run dev
```

Then open the address it prints. To run the tests:

```
npm test
```

There are 14. They check the sample data is consistent (no batch ships more than was made), that tracing forward and back gives the answers worked out by hand, that a batch reached two ways is counted once, and that the totals and the CSV are right.

To rebuild the published site:

```
npm run build
```

That writes the site to `docs/`, which is the folder GitHub Pages publishes.

## What it does not do

- **Quantities are not traced.** It knows a lot went into a batch, not how many kilograms. A real system needs that to work out how much of a lot is unaccounted for.
- **It assumes the links are right.** A trace is only as good as the batch records behind it. If someone used a lot and did not write it down, no software will find it.
- **Whole batches only.** If part of a batch was reworked or split, that needs its own records.
- **No sign-in and no saving.** It is a working model of the logic and the screen, not a system of record.

## Built with

React, TypeScript and Vite. Vitest for the tests. No other libraries.

## Files

- `src/trace.ts` is the tracing logic, and `src/trace.test.ts` tests it.
- `src/data.ts` is the made-up data.
- `src/App.tsx` and `src/styles.css` are the screen.
- `db/` is the Postgres version.
- `docs/` is the built site.
