const pool = require('../db/connection');

// Auto-generate reference like DEV-2026-001
async function generateDevisRef() {
    const year = new Date().getFullYear();
    const [rows] = await pool.query(
        "SELECT COUNT(*) as cnt FROM devis WHERE YEAR(date) = ?", [year]
    );
    const count = rows[0].cnt + 1;
    return `DEV-${year}-${String(count).padStart(3, '0')}`;
}

exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT d.*, c.name AS client_name
      FROM devis d
      LEFT JOIN clients c ON d.client_id = c.id
      ORDER BY d.id DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT d.*, c.name AS client_name, c.email AS client_email,
             c.phone AS client_phone, c.address AS client_address,
             c.matricule_fiscale AS client_mf
      FROM devis d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id=?
    `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const [items] = await pool.query("SELECT * FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);
        res.json({ ...rows[0], items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { client_id, date, valid_until, status, items } = req.body;

        // Get company snapshot
        const [co] = await conn.query('SELECT * FROM company_info LIMIT 1');
        const company = co[0] || {};

        const reference = await generateDevisRef();
        const total_amount = (items || []).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0);

        console.log('INSERT DEVIS:', reference);
        const [result] = await conn.query(
            `INSERT INTO devis (client_id, reference, date, valid_until, status, total_amount)
       VALUES (?,?,?,?,?,?)`,
            [client_id, reference, date, valid_until, status || 'pending', total_amount]
        );
        const devisId = result.insertId;

        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, quantity, unit_price, total_price) VALUES ('devis',?,?,?,?,?)",
                [devisId, item.description, item.quantity, item.unit_price, item.total_price]
            );
        }

        await conn.commit();
        const [newDevis] = await conn.query('SELECT * FROM devis WHERE id=?', [devisId]);
        const [newItems] = await conn.query("SELECT * FROM invoice_items WHERE type='devis' AND parent_id=?", [devisId]);
        res.status(201).json({ ...newDevis[0], items: newItems });
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
        const { client_id, date, valid_until, status, items } = req.body;
        const total_amount = (items || []).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0);

        console.log('UPDATE DEVIS:', req.params.id);
        await conn.query(
            'UPDATE devis SET client_id=?, date=?, valid_until=?, status=?, total_amount=? WHERE id=?',
            [client_id, date, valid_until, status, total_amount, req.params.id]
        );

        await conn.query("DELETE FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);
        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, quantity, unit_price, total_price) VALUES ('devis',?,?,?,?,?)",
                [req.params.id, item.description, item.quantity, item.unit_price, item.total_price]
            );
        }

        await conn.commit();
        const [updated] = await conn.query('SELECT * FROM devis WHERE id=?', [req.params.id]);
        const [updItems] = await conn.query("SELECT * FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);
        res.json({ ...updated[0], items: updItems });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query("DELETE FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);
        await pool.query('DELETE FROM devis WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE devis SET status=? WHERE id=?', [status, req.params.id]);
        const [rows] = await pool.query('SELECT * FROM devis WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Convert devis to facture
exports.convertToFacture = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [devisRows] = await conn.query('SELECT * FROM devis WHERE id=?', [req.params.id]);
        if (!devisRows.length) return res.status(404).json({ error: 'Devis not found' });
        const devis = devisRows[0];

        const year = new Date().getFullYear();
        const [cnt] = await conn.query("SELECT COUNT(*) as c FROM factures WHERE YEAR(date)=?", [year]);
        const ref = `FAC-${year}-${String(cnt[0].c + 1).padStart(3, '0')}`;

        const [facResult] = await conn.query(
            `INSERT INTO factures (client_id, reference, date, status, total_amount, devis_id)
       VALUES (?,?,CURDATE(),'unpaid',?,?)`,
            [devis.client_id, ref, devis.total_amount, devis.id]
        );
        const factureId = facResult.insertId;

        const [items] = await conn.query("SELECT * FROM invoice_items WHERE type='devis' AND parent_id=?", [req.params.id]);
        for (const item of items) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, quantity, unit_price, total_price) VALUES ('facture',?,?,?,?,?)",
                [factureId, item.description, item.quantity, item.unit_price, item.total_price]
            );
        }

        await conn.query('UPDATE devis SET status="accepted" WHERE id=?', [req.params.id]);
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
