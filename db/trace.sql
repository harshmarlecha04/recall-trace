-- The two traces as SQL. Replace 'L-0732' with the lot, blend, batch or shipment in question.
-- UNION (not UNION ALL) is what stops a blend reached two ways from being counted twice.

-- 1. Where did it go? Everything downstream of one item.
WITH RECURSIVE downstream (id) AS (
  SELECT to_id FROM links WHERE from_id = 'L-0732'
  UNION
  SELECT l.to_id FROM links l JOIN downstream d ON l.from_id = d.id
)
SELECT i.id, i.kind, i.name, i.detail, i.happened_on, i.units
FROM downstream d
JOIN items i ON i.id = d.id
ORDER BY i.kind, i.id;

-- 2. Where did it come from? Everything upstream of one item.
WITH RECURSIVE upstream (id) AS (
  SELECT from_id FROM links WHERE to_id = 'S-3110'
  UNION
  SELECT l.from_id FROM links l JOIN upstream u ON l.to_id = u.id
)
SELECT i.id, i.kind, i.name, i.detail, i.happened_on
FROM upstream u
JOIN items i ON i.id = u.id
ORDER BY i.kind, i.id;

-- 3. The call list: customers who received anything made with one lot, biggest exposure first.
WITH RECURSIVE downstream (id) AS (
  SELECT to_id FROM links WHERE from_id = 'L-0732'
  UNION
  SELECT l.to_id FROM links l JOIN downstream d ON l.from_id = d.id
)
SELECT i.detail AS customer, COUNT(*) AS shipments, SUM(i.units) AS bottles
FROM downstream d
JOIN items i ON i.id = d.id
WHERE i.kind = 'shipment'
GROUP BY i.detail
ORDER BY bottles DESC, customer;
