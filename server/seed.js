const path = require('path');
const pool = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Read products from JSON
const productsData = require('../Products.json');
const products = Object.values(productsData);

async function seed() {
  console.log(`📦 Seeding ${products.length} products into PostgreSQL...`);

  let inserted = 0;
  let skipped = 0;

  for (const p of products) {
    try {
      const result = await pool.query(
        `INSERT INTO products 
          (id, category, manufacturer, name, description, in_stock, rating, reviews, image, badge, badge_color, price, old_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.category || '',
          p.manufacturer || '',
          p.name || '',
          p.description || '',
          p.inStock !== undefined ? p.inStock : true,
          p.rating || 4.5,
          p.reviews || 0,
          p.image || '',
          p.badge || '',
          p.badgeColor || 'bg-blue-500',
          p.price || 0,
          p.oldPrice || 0,
        ]
      );

      if (result.rowCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`❌ Failed to insert product id=${p.id}: ${err.message}`);
    }
  }

  // Reset sequence to max id
  await pool.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);

  console.log(`✅ Seeding complete: ${inserted} inserted, ${skipped} skipped`);
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
