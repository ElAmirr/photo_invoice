const pool = require('../db/connection');

async function syncFactureStatus(factureId, conn) {
    if (!factureId) return;
    const db = conn || pool;

    try {
        const [factures] = await db.query('SELECT id, total_amount, shooting_id FROM factures WHERE id = ?', [factureId]);
        if (!factures.length) return;

        const f = factures[0];
        const totalAmount = parseFloat(f.total_amount || 0);

        // Simplified query to avoid complex OR/Subquery that might fail on some SQLite builds
        let query = 'SELECT SUM(amount) as total FROM payments WHERE facture_id = ?';
        let params = [factureId];

        if (f.shooting_id) {
            query += ' OR shooting_id = ?';
            params.push(f.shooting_id);
        }

        const [payments] = await db.query(query, params);
        const totalPaid = parseFloat(payments[0].total || 0);

        let status = 'unpaid';
        if (totalPaid >= (totalAmount - 0.001) && totalAmount > 0) {
            status = 'paid';
        } else if (totalPaid > 0.001) {
            status = 'partial';
        }

        console.log(`SyncFactureStatus: ID=${factureId}, Paid=${totalPaid}, Total=${totalAmount}, NewStatus=${status}`);
        await db.query('UPDATE factures SET status = ? WHERE id = ?', [status, factureId]);
    } catch (err) {
        console.error('Error in syncFactureStatus:', err);
    }
}

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
        // Use epsilon for robust float comparison
        if (totalPaid >= (totalAmount - 0.001) && totalAmount > 0) {
            status = 'paid';
        } else if (totalPaid > 0.001) {
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

exports.getByFactureId = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM payments WHERE facture_id=? ORDER BY payment_date ASC',
            [req.params.factureId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { shooting_id, facture_id, amount, payment_date, method, note } = req.body;
        console.log(`Backend: Creating payment for facture ${facture_id}, amount: ${amount}`);

        const [result] = await pool.query(
            'INSERT INTO payments (shooting_id, facture_id, amount, payment_date, method, note) VALUES (?,?,?,?,?,?)',
            [shooting_id || null, facture_id || null, amount, payment_date, method, note]
        );
        console.log(`Backend: Payment inserted, ID: ${result.insertId}`);

        if (facture_id) {
            console.log(`Backend: Syncing status for facture ${facture_id}`);
            await syncFactureStatus(facture_id);
        }

        // ALSO sync shooting if provided, don't use "else if"
        if (shooting_id) {
            console.log(`Backend: Syncing status for shooting ${shooting_id}`);
            await syncInvoiceStatus(shooting_id);
        }

        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(' Backend Payment Create Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { amount, payment_date, method, note } = req.body;
        const [pRows] = await pool.query('SELECT shooting_id, facture_id FROM payments WHERE id=?', [req.params.id]);
        if (!pRows.length) return res.status(404).json({ error: 'Not found' });
        const { shooting_id: shootingId, facture_id: factureId } = pRows[0];

        await pool.query(
            'UPDATE payments SET amount=?, payment_date=?, method=?, note=? WHERE id=?',
            [amount, payment_date, method, note, req.params.id]
        );

        if (factureId) {
            await syncFactureStatus(factureId);
        } else {
            await syncInvoiceStatus(shootingId);
        }

        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [pRows] = await pool.query('SELECT shooting_id, facture_id FROM payments WHERE id=?', [req.params.id]);
        if (!pRows.length) return res.status(404).json({ error: 'Not found' });
        const { shooting_id: shootingId, facture_id: factureId } = pRows[0];

        await pool.query('DELETE FROM payments WHERE id=?', [req.params.id]);

        if (factureId) {
            await syncFactureStatus(factureId);
        } else if (shootingId) {
            await syncInvoiceStatus(shootingId);
        }

        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Delete Payment Error:', err);
        res.status(500).json({ error: err.message });
    }
};
