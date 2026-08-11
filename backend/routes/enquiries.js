const express = require('express');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { enquiryToEmail, web3formsAccessKey } = require('../config');
const router = express.Router();

// POST /api/enquiries — public (save enquiry from contact form)
router.post('/', async (req, res) => {
  try {
    const {
      name, email, phone, subject, message,
      product_id, product_name, product_image, quantity
    } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (trimmedName.length > 120 || trimmedEmail.length > 254 || trimmedSubject.length > 200 || trimmedMessage.length > 5000) {
      return res.status(400).json({ error: 'One or more fields exceed the allowed length' });
    }

    const safeQuantity = Math.min(Math.max(Number.parseInt(quantity, 10) || 1, 1), 100000);

    const result = await pool.query(
      `INSERT INTO enquiries
        (name, email, phone, subject, message, product_id, product_name, product_image, quantity, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'New')
       RETURNING *`,
      [trimmedName, trimmedEmail, phone || '', trimmedSubject, trimmedMessage, product_id || null, product_name || null, product_image || null, safeQuantity]
    );

    res.status(201).json({
      success: true,
      enquiry: result.rows[0],
      web3forms_key: web3formsAccessKey || null
    });
  } catch (err) {
    console.error('POST /enquiries error:', err.message);
    res.status(500).json({ error: 'Failed to save enquiry' });
  }
});

// GET /api/enquiries — admin only, with search + pagination
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = 'SELECT * FROM enquiries WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (LOWER(name) LIKE LOWER($${params.length}) OR LOWER(email) LIKE LOWER($${params.length}) OR phone LIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    // Count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Paginated
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      enquiries: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /enquiries error:', err.message);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// PATCH /api/enquiries/:id/status — admin only
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['New', 'Contacted', 'Converted', 'Closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await pool.query(
      'UPDATE enquiries SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /api/enquiries/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM enquiries WHERE id=$1', [req.params.id]);
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

module.exports = router;
