const pool = require('../db/connection');

async function syncShootingPrice(factureId, conn) {
    const db = conn || pool;
    const [factures] = await db.query('SELECT shooting_id, total_amount FROM factures WHERE id = ?', [factureId]);
    if (factures.length > 0 && factures[0].shooting_id) {
        await db.query('UPDATE shootings SET total_price = ? WHERE id = ?', [factures[0].total_amount, factures[0].shooting_id]);
    }
}

async function generateFactureRef() {
    const year = new Date().getFullYear();
    let reference;
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
        // Count factures for the current year using SQLite-compatible syntax
        const [rows] = await pool.query(
            "SELECT COUNT(*) as cnt FROM factures WHERE CAST(strftime('%Y', date) AS INTEGER) = ?",
            [year]
        );
        const count = rows[0].cnt + 1 + attempt;
        reference = `FAC-${year}-${String(count).padStart(3, '0')}`;

        // Check if this reference already exists
        const [existing] = await pool.query(
            "SELECT id FROM factures WHERE reference = ?",
            [reference]
        );

        if (!existing || existing.length === 0) {
            return reference;
        }

        attempt++;
    }

    // Fallback: use timestamp-based unique reference
    return `FAC-${year}-${Date.now()}`;
}

exports.getAll = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        console.log('Factures Filter:', { startDate, endDate, status });
        let query = `
      SELECT f.*, c.name AS client_name,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE shooting_id = f.shooting_id OR facture_id = f.id) AS total_paid
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      WHERE 1=1`;
        let params = [];

        console.log('Factures Filter:', { startDate, endDate, status });

        if (startDate && endDate) {
            query += " AND f.date BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }

        if (status === 'paid') {
            query += " AND (COALESCE(LOWER(f.status), '') = 'paid' OR (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE shooting_id = f.shooting_id OR facture_id = f.id) >= f.total_amount - 0.01)";
        } else if (status === 'unpaid') {
            query += " AND (COALESCE(LOWER(f.status), '') != 'paid') AND (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE shooting_id = f.shooting_id OR facture_id = f.id) < f.total_amount - 0.01";
        }

        console.log('Executing Query:', query);
        console.log('With Params:', params);

        query += " ORDER BY f.id DESC";
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT f.*, c.name AS client_name, c.email AS client_email,
             c.phone AS client_phone, c.address AS client_address,
             c.matricule_fiscale AS client_mf,
             s.title AS shooting_title,
             COALESCE((SELECT SUM(amount) FROM payments WHERE shooting_id = f.shooting_id OR facture_id = f.id), 0) AS total_paid
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      LEFT JOIN shootings s ON f.shooting_id = s.id
      WHERE f.id=?
    `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const [items] = await pool.query("SELECT * FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);
        res.json({ ...rows[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { client_id, date, status, shooting_id, items, tva_suspended, suspension_number } = req.body;
        const isSuspended = !!tva_suspended;

        let reference;
        let factureInsertResult;
        const subtotal_amount = (items || []).reduce((sum, i) => sum + Number(i.total_price || 0), 0);
        const tax_amount = isSuspended ? 0 : Number((subtotal_amount * 0.19).toFixed(3));
        const total_amount = Number((subtotal_amount + tax_amount + 1.000).toFixed(3));

        for (let attempt = 0; attempt < 5; attempt++) {
            reference = await generateFactureRef();
            try {
                const [result] = await conn.query(
                    `INSERT INTO factures (client_id, reference, date, status, subtotal_amount, tax_amount, total_amount, shooting_id, bon_commande, tva_suspended, suspension_number)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [client_id, reference, date, status || 'unpaid', subtotal_amount, tax_amount, total_amount, shooting_id || null, req.body.bon_commande || null, isSuspended ? 1 : 0, suspension_number || null]
                );
                factureInsertResult = result;
                break;
            } catch (err) {
                if (err.message && err.message.includes('UNIQUE constraint failed: factures.reference')) {
                    // collision detected, try another reference
                    continue;
                }
                throw err;
            }
        }

        if (!factureInsertResult) {
            throw new Error('Unable to generate unique facture reference after several attempts');
        }

        const factureId = factureInsertResult.insertId;

        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, days, quantity, unit_price, total_price) VALUES ('facture',?,?,?,?,?,?)",
                [factureId, item.description, item.days || null, item.quantity, item.unit_price, item.total_price]
            );
        }

        await syncShootingPrice(factureId, conn);
        await conn.commit();

        const [newFac] = await conn.query('SELECT * FROM factures WHERE id=?', [factureId]);
        const [newItems] = await conn.query("SELECT * FROM invoice_items WHERE type='facture' AND parent_id=?", [factureId]);
        res.status(201).json({ ...newFac[0], items: newItems });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};

exports.update = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { client_id, date, status, shooting_id, items, tva_suspended, suspension_number } = req.body;
        const isSuspended = !!tva_suspended;
        const subtotal_amount = (items || []).reduce((sum, i) => sum + Number(i.total_price || 0), 0);
        const tax_amount = isSuspended ? 0 : Number((subtotal_amount * 0.19).toFixed(3));
        const total_amount = Number((subtotal_amount + tax_amount + 1.000).toFixed(3));

        await conn.query(
            'UPDATE factures SET client_id=?, date=?, status=?, shooting_id=?, subtotal_amount=?, tax_amount=?, total_amount=?, bon_commande=?, tva_suspended=?, suspension_number=? WHERE id=?',
            [client_id, date, status, shooting_id || null, subtotal_amount, tax_amount, total_amount, req.body.bon_commande || null, isSuspended ? 1 : 0, suspension_number || null, req.params.id]
        );

        await conn.query("DELETE FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);
        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, days, quantity, unit_price, total_price) VALUES ('facture',?,?,?,?,?,?)",
                [req.params.id, item.description, item.days || null, item.quantity, item.unit_price, item.total_price]
            );
        }

        await syncShootingPrice(req.params.id, conn);
        await conn.commit();

        const [updated] = await conn.query('SELECT * FROM factures WHERE id=?', [req.params.id]);
        const [updItems] = await conn.query("SELECT * FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);
        res.json({ ...updated[0], items: updItems });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};

exports.remove = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const id = req.params.id;

        // 1. Delete associated payments
        await conn.query('DELETE FROM payments WHERE facture_id=?', [id]);

        // 2. Delete invoice items
        await conn.query("DELETE FROM invoice_items WHERE type='facture' AND parent_id=?", [id]);

        // 3. Delete the facture itself
        await conn.query('DELETE FROM factures WHERE id=?', [id]);

        await conn.commit();
        res.json({ message: 'Facture and related payments/items deleted successfully' });
    } catch (err) {
        await conn.rollback();
        console.error('Delete Facture Error:', err);
        res.status(500).json({ error: 'Failed to delete facture: ' + err.message });
    } finally {
        conn.release();
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE factures SET status=? WHERE id=?', [status, req.params.id]);
        const [rows] = await pool.query('SELECT * FROM factures WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
