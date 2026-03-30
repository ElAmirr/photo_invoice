const pool = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, email, phone, address, matricule_fiscale } = req.body;
        const [result] = await pool.query(
            'INSERT INTO clients (name, email, phone, address, matricule_fiscale) VALUES (?,?,?,?,?)',
            [name, email, phone, address, matricule_fiscale]
        );
        const [rows] = await pool.query('SELECT * FROM clients WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, email, phone, address, matricule_fiscale } = req.body;
        await pool.query(
            'UPDATE clients SET name=?, email=?, phone=?, address=?, matricule_fiscale=? WHERE id=?',
            [name, email, phone, address, matricule_fiscale, req.params.id]
        );
        const [rows] = await pool.query('SELECT * FROM clients WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM clients WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Get factures and payments aggregates
        const [factureData] = await pool.query(`
            SELECT 
                COUNT(DISTINCT f.id) as total_factures_count,
                COALESCE(SUM(f.total_amount), 0) as total_factures_amount,
                COUNT(DISTINCT CASE WHEN f.shooting_id IS NOT NULL THEN f.shooting_id END) as shooting_count,
                COALESCE(SUM(p.amount), 0) as total_paid
            FROM factures f
            LEFT JOIN payments p ON (p.facture_id = f.id OR p.shooting_id = f.shooting_id)
            WHERE f.client_id = ?
        `, [clientId]);

        const analytics = factureData[0];
        const balance_due = analytics.total_factures_amount - analytics.total_paid;

        res.json({
            total_factures_count: analytics.total_factures_count || 0,
            total_factures_amount: analytics.total_factures_amount || 0,
            total_paid: analytics.total_paid || 0,
            balance_due: balance_due || 0,
            shooting_count: analytics.shooting_count || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
