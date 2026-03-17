const pool = require('../db/connection');

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
        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { amount, payment_date, method, note } = req.body;
        await pool.query(
            'UPDATE payments SET amount=?, payment_date=?, method=?, note=? WHERE id=?',
            [amount, payment_date, method, note, req.params.id]
        );
        const [rows] = await pool.query('SELECT * FROM payments WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM payments WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
