-- ENKEglobal Database Schema

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  rating NUMERIC(3,1) DEFAULT 4.5,
  reviews INT DEFAULT 0,
  image TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  badge_color TEXT DEFAULT 'bg-blue-500',
  price NUMERIC(12,2) DEFAULT 0,
  old_price NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  product_id INT,
  product_name TEXT,
  product_image TEXT,
  quantity INT DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Upgrade databases created before lead statuses were introduced.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
