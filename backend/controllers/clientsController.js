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
