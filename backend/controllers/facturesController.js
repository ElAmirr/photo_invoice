const pool = require('../db/connection');

async function generateFactureRef() {
    const year = new Date().getFullYear();
    const [rows] = await pool.query("SELECT COUNT(*) as cnt FROM factures WHERE YEAR(date)=?", [year]);
    return `FAC-${year}-${String(rows[0].cnt + 1).padStart(3, '0')}`;
}

exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT f.*, c.name AS client_name
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      ORDER BY f.id DESC
    `);
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
             c.matricule_fiscale AS client_mf
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
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
        const { client_id, date, status, shooting_id, items } = req.body;

        const [co] = await conn.query('SELECT * FROM company_info LIMIT 1');
        const company = co[0] || {};

        const reference = await generateFactureRef();
        const total_amount = (items || []).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0);

        console.log('INSERT FACTURE:', reference);
        const [result] = await conn.query(
            `INSERT INTO factures (client_id, reference, date, status, total_amount, shooting_id)
       VALUES (?,?,?,?,?,?)`,
            [client_id, reference, date, status || 'unpaid', total_amount, shooting_id || null]
        );
        const factureId = result.insertId;

        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, quantity, unit_price, total_price) VALUES ('facture',?,?,?,?,?)",
                [factureId, item.description, item.quantity, item.unit_price, item.total_price]
            );
        }

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
        const { client_id, date, status, shooting_id, items } = req.body;
        const total_amount = (items || []).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0);

        await conn.query(
            'UPDATE factures SET client_id=?, date=?, status=?, shooting_id=?, total_amount=? WHERE id=?',
            [client_id, date, status, shooting_id || null, total_amount, req.params.id]
        );

        await conn.query("DELETE FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);
        for (const item of (items || [])) {
            await conn.query(
                "INSERT INTO invoice_items (type, parent_id, description, quantity, unit_price, total_price) VALUES ('facture',?,?,?,?,?)",
                [req.params.id, item.description, item.quantity, item.unit_price, item.total_price]
            );
        }

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
    try {
        await pool.query("DELETE FROM invoice_items WHERE type='facture' AND parent_id=?", [req.params.id]);
        await pool.query('DELETE FROM factures WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
