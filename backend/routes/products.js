const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { uploadDir, excelImportTempDir } = require('../config');
const { parseProductWorkbook } = require('../services/excelImport');
const router = express.Router();

const MAX_EXCEL_FILE_BYTES = 1024 * 1024 * 1024;
const INSERT_BATCH_SIZE = 1000;

const excelUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdir(excelImportTempDir, { recursive: true }, (error) => callback(error, excelImportTempDir));
    },
    filename: (_req, _file, callback) => callback(null, `${Date.now()}_${crypto.randomUUID()}.xlsx`),
  }),
  limits: { fileSize: MAX_EXCEL_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isXlsx = path.extname(file.originalname).toLowerCase() === '.xlsx';
    callback(isXlsx ? null : new Error('Only .xlsx Excel files are supported'), isXlsx);
  },
}).single('file');

function acceptExcelUpload(req, res, next) {
  excelUpload(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Excel workbook exceeds the 1 GB upload limit' });
    }
    if (error) return res.status(400).json({ error: error.message });
    next();
  });
}

// GET /api/products — public, paginated
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const offset = (page - 1) * limit;
    const category = req.query.category || '';
    const search = req.query.search || '';

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (LOWER(name) LIKE LOWER($${params.length}) OR LOWER(manufacturer) LIKE LOWER($${params.length}) OR LOWER(description) LIKE LOWER($${params.length}))`;
    }

    // Count total
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Paginated data
    params.push(limit, offset);
    query += ` ORDER BY id ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      products: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /products error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id — public
// GET /api/products/stats/summary — admin
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM products');
    const byCategory = await pool.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC'
    );
    const inStock = await pool.query(
      'SELECT COUNT(*) FROM products WHERE in_stock = true'
    );
    res.json({
      total: parseInt(total.rows[0].count),
      inStock: parseInt(inStock.rows[0].count),
      byCategory: byCategory.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/products — admin
// Public product detail. Numeric matching keeps named routes from being shadowed.
// Admin-only bulk import from an .xlsx workbook.
router.post('/import', requireAdmin, acceptExcelUpload, async (req, res) => {
  let client = null;
  const createdFiles = [];

  try {
    if (!req.file) return res.status(400).json({ error: 'Please choose an .xlsx file' });

    const parsed = await parseProductWorkbook(req.file.path, req.body.category);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const preparedProducts = [];
    for (const product of parsed.products) {
      let image = product.image;
      if (product.embeddedImage) {
        const extension = product.embeddedImage.extension === 'jpg' ? 'jpeg' : product.embeddedImage.extension;
        const filename = `excel_${Date.now()}_${crypto.randomUUID()}.${extension}`;
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, product.embeddedImage.buffer, { flag: 'wx' });
        createdFiles.push(filePath);
        image = `/uploads/${filename}`;
      }

      preparedProducts.push({
        category: product.category,
        manufacturer: product.manufacturer,
        name: product.name,
        description: product.description,
        in_stock: product.in_stock,
        rating: product.rating,
        reviews: product.reviews,
        image,
        badge: product.badge,
        badge_color: product.badge_color,
        price: product.price,
        old_price: product.old_price,
      });
      if (product.embeddedImage) product.embeddedImage.buffer = null;
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const insertedRows = [];
    for (let batchStart = 0; batchStart < preparedProducts.length; batchStart += INSERT_BATCH_SIZE) {
      const batch = preparedProducts.slice(batchStart, batchStart + INSERT_BATCH_SIZE);
      const values = [];
      const placeholders = batch.map((product, index) => {
        const offset = index * 12;
        values.push(
          product.category,
          product.manufacturer,
          product.name,
          product.description,
          product.in_stock,
          product.rating,
          product.reviews,
          product.image,
          product.badge,
          product.badge_color,
          product.price,
          product.old_price
        );
        const rowParams = Array.from({ length: 12 }, (_, paramIndex) => `$${offset + paramIndex + 1}`);
        return `(${rowParams.join(',')},NOW())`;
      });

      const result = await client.query(
        `INSERT INTO products
          (category, manufacturer, name, description, in_stock, rating, reviews, image, badge, badge_color, price, old_price, updated_at)
         VALUES ${placeholders.join(',')}
         RETURNING id, name, image`,
        values
      );
      insertedRows.push(...result.rows);
    }

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      imported: insertedRows.length,
      category: parsed.category,
      worksheet: parsed.worksheetName,
      products: insertedRows.slice(0, 50),
      responseTruncated: insertedRows.length > 50,
      warnings: parsed.warnings,
    });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* connection already failed */ }
    }
    await Promise.allSettled(createdFiles.map((filePath) => fs.promises.unlink(filePath)));

    const isWorkbookError = Array.isArray(error.details) ||
      /workbook|\.xlsx|product rows|category|header|image|maximum/i.test(error.message || '');
    console.error('POST /products/import error:', error.message);
    res.status(isWorkbookError ? 400 : 500).json({
      error: error.message || 'Failed to import products',
      ...(Array.isArray(error.details) && { details: error.details }),
    });
  } finally {
    if (client) client.release();
    if (req.file?.path) {
      try { await fs.promises.unlink(req.file.path); } catch (error) {
        if (error.code !== 'ENOENT') console.error('Failed to remove temporary Excel workbook:', error.message);
      }
    }
  }
});

router.get('/:id(\\d+)', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      category, manufacturer, name, description,
      in_stock, rating, reviews, image, badge, badge_color
    } = req.body;
    const price = req.body.price !== undefined && req.body.price !== null ? req.body.price : 0;
    const old_price = req.body.old_price !== undefined && req.body.old_price !== null ? req.body.old_price : 0;

    const result = await pool.query(
      `INSERT INTO products 
        (category, manufacturer, name, description, in_stock, rating, reviews, image, badge, badge_color, price, old_price, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       RETURNING *`,
      [category, manufacturer, name, description, in_stock, rating, reviews, image, badge, badge_color, price, old_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /products error:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — admin
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      category, manufacturer, name, description,
      in_stock, rating, reviews, image, badge, badge_color
    } = req.body;
    const price = req.body.price !== undefined && req.body.price !== null ? req.body.price : 0;
    const old_price = req.body.old_price !== undefined && req.body.old_price !== null ? req.body.old_price : 0;

    const result = await pool.query(
      `UPDATE products SET
        category=$1, manufacturer=$2, name=$3, description=$4,
        in_stock=$5, rating=$6, reviews=$7, image=$8,
        badge=$9, badge_color=$10, price=$11, old_price=$12, updated_at=NOW()
       WHERE id=$13
       RETURNING *`,
      [category, manufacturer, name, description, in_stock, rating, reviews, image, badge, badge_color, price, old_price, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /products error:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
