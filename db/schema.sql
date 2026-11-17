-- Tables for the same data the app uses, for Postgres (Supabase runs Postgres).
-- The app in this repository reads from src/data.ts so it can run with no server.
-- These files show how the same thing sits in a real database.

CREATE TABLE items (
  id          text PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('lot', 'blend', 'batch', 'shipment')),
  name        text NOT NULL,        -- material or product
  detail      text NOT NULL,        -- supplier, stage, or customer
  happened_on date NOT NULL,        -- received, made, or shipped
  units       integer               -- bottles made (batch) or shipped (shipment)
);

-- One row each time something was used in, or shipped as, something else.
CREATE TABLE links (
  from_id text NOT NULL REFERENCES items (id),
  to_id   text NOT NULL REFERENCES items (id),
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id <> to_id)
);

CREATE INDEX links_to_idx ON links (to_id);
