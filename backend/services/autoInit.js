const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function autoInitDatabase() {
  try {
    console.log('🔄 Checking database initialization...');
    
    // 1. Run migrations
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../migrations/001_init.sql'),
      'utf8'
    );
    await pool.query(migrationSql);
    console.log('✅ Database schema verified / migrated');

    // 2. Check if products table is empty
    const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM products');
    const productCount = rows[0]?.count || 0;

    if (productCount === 0) {
      console.log('📦 Products table is empty. Auto-seeding initial catalogue...');
      const productsData = require('../data/Products.json');
      const products = Object.values(productsData);

      let inserted = 0;
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
          if (result.rowCount > 0) inserted++;
        } catch (err) {
          console.error(`❌ Failed to insert product id=${p.id}: ${err.message}`);
        }
      }

      await pool.query(`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1))`);
      console.log(`✅ Auto-seed completed: ${inserted} products inserted`);
    } else {
      console.log(`✅ Database already populated with ${productCount} products`);
    }
  } catch (err) {
    console.error('⚠️ Database auto-initialization error:', err.message);
  }
}

module.exports = { autoInitDatabase };
