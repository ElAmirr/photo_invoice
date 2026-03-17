const pool = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM freelancers ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM freelancers WHERE id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, phone, specialty } = req.body;
        const [result] = await pool.query(
            'INSERT INTO freelancers (name, phone, specialty) VALUES (?,?,?)',
            [name, phone, specialty]
        );
        const [rows] = await pool.query('SELECT * FROM freelancers WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, phone, specialty } = req.body;
        await pool.query(
            'UPDATE freelancers SET name=?, phone=?, specialty=? WHERE id=?',
            [name, phone, specialty, req.params.id]
        );
        const [rows] = await pool.query('SELECT * FROM freelancers WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM freelancers WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
