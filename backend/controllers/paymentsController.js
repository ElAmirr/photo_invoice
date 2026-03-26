const pool = require('../db/connection');

async function syncInvoiceStatus(shootingId, conn) {
    if (!shootingId) return;
    const db = conn || pool;

    // 1. Get total paid for this shooting
    const [payments] = await db.query('SELECT SUM(amount) as total FROM payments WHERE shooting_id = ?', [shootingId]);
    const totalPaid = parseFloat(payments[0].total || 0);

    // 2. Find linked facture
    const [factures] = await db.query('SELECT id, total_amount FROM factures WHERE shooting_id = ?', [shootingId]);
    if (factures.length > 0) {
        const facture = factures[0];
        const totalAmount = parseFloat(facture.total_amount || 0);

        let status = 'unpaid';
        if (totalPaid >= totalAmount && totalAmount > 0) {
            status = 'paid';
        } else if (totalPaid > 0) {
            status = 'partial';
        }

        await db.query('UPDATE factures SET status = ? WHERE id = ?', [status, facture.id]);
    }
}

exports.getByShootingId = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM payments WHERE shooting_id=? ORDER BY payment_date ASC',
            [req.params.shootingId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { shooting_id, amount, payment_date, method, note } = req.body;
        const [result] = await pool.query(
            'INSERT INTO payments (shooting_id, amount, payment_date, method, note) VALUES (?,?,?,?,?)',
            [shooting_id, amount, payment_date, method, note]
        );

        await syncInvoiceStatus(shooting_id);

        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { amount, payment_date, method, note } = req.body;
        // Need to find shooting_id first for sync
        const [pRows] = await pool.query('SELECT shooting_id FROM payments WHERE id=?', [req.params.id]);
        if (!pRows.length) return res.status(404).json({ error: 'Not found' });
        const shootingId = pRows[0].shooting_id;

        await pool.query(
            'UPDATE payments SET amount=?, payment_date=?, method=?, note=? WHERE id=?',
            [amount, payment_date, method, note, req.params.id]
        );

        await syncInvoiceStatus(shootingId);

        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [pRows] = await pool.query('SELECT shooting_id FROM payments WHERE id=?', [req.params.id]);
        if (!pRows.length) return res.status(404).json({ error: 'Not found' });
        const shootingId = pRows[0].shooting_id;

        await pool.query('DELETE FROM payments WHERE id=?', [req.params.id]);

        await syncInvoiceStatus(shootingId);

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
