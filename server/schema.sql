CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Burgers','Drinks','Desserts')),
  price INTEGER NOT NULL CHECK (price > 0),
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Preparing','Ready','Completed','Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0)
);
INSERT INTO products (name, category, price, description)
SELECT * FROM (VALUES
 ('Cheeseburger','Burgers',2500,'Beef, cheese, sauce'),
 ('Chicken Burger','Burgers',2800,'Chicken, cheese, vegetables'),
 ('Cola','Drinks',800,'Cold soft drink'),
 ('Lemonade','Drinks',1100,'Fresh lemon, mint'),
 ('Cheesecake','Desserts',1800,'Classic, berry sauce')
) AS v(name, category, price, description)
WHERE NOT EXISTS (SELECT 1 FROM products);


ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
INSERT INTO products(name,category,price,description)
SELECT v.* FROM (VALUES
 ('Double Burger','Burgers',3400,'Two juicy beef patties, cheddar and pickles'),
 ('Americano','Drinks',1000,'Freshly brewed black coffee, 250 ml'),
 ('Brownie','Desserts',1500,'Rich chocolate brownie with walnuts')
) AS v(name,category,price,description)
WHERE NOT EXISTS(SELECT 1 FROM products p WHERE p.name=v.name);
