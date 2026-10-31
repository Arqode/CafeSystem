-- C1-C3. Repeat in: docker compose exec -T db psql -U cafe -d cafe
-- All values are calculated from database records, not hardcoded chart values.
-- Data includes 120 synthetic seed orders, marked orders.is_demo = TRUE.
-- To study only the seed batch, add AND o.is_demo / AND is_demo as appropriate.

-- Q1: Which products are ordered most? Horizontal bar chart.
SELECT i.name AS product, SUM(i.qty) AS items_ordered
FROM order_items i JOIN orders o ON o.id = i.order_id
WHERE o.status <> 'Cancelled'
GROUP BY i.name ORDER BY items_ordered DESC LIMIT 8;

-- Q2: How does completed revenue change by day? Line chart.
SELECT to_char(created_at AT TIME ZONE 'Asia/Qyzylorda', 'YYYY-MM-DD') AS day,
       SUM(total) AS revenue_kzt
FROM orders WHERE status = 'Completed'
GROUP BY day ORDER BY day DESC LIMIT 14;

-- Q3: At which hours are orders placed? Horizontal bar chart.
SELECT to_char(created_at AT TIME ZONE 'Asia/Qyzylorda', 'HH24:00') AS hour,
       COUNT(*) AS orders
FROM orders GROUP BY hour ORDER BY hour;

-- Summary displayed in the product.
SELECT COUNT(*) AS orders,
 COUNT(*) FILTER (WHERE is_demo) AS synthetic_orders,
 SUM(total) FILTER (WHERE status='Completed') AS completed_revenue_kzt,
 AVG(total) FILTER (WHERE status='Completed') AS average_completed_order_kzt
FROM orders;

-- Demonstrate persistence: show newest order and its lines.
SELECT o.id, o.status, o.total, o.created_at, i.name, i.price, i.qty
FROM orders o JOIN order_items i ON i.order_id=o.id
WHERE o.id=(SELECT MAX(id) FROM orders);
