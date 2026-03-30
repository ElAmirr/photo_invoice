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

exports.getAnalytics = async (req, res) => {
    try {
        const freelancerId = req.params.id;
        
        // Get shooting freelancer assignments and calculate earnings
        const [analyticsData] = await pool.query(`
            SELECT 
                COUNT(sf.id) as total_assignments_count,
                COALESCE(SUM(sf.agreed_amount), 0) as total_agreed_amount,
                COALESCE(SUM(sf.paid_amount), 0) as total_paid_amount
            FROM shooting_freelancers sf
            WHERE sf.freelancer_id = ?
        `, [freelancerId]);

        const analytics = analyticsData[0];
        const balance_owed = analytics.total_agreed_amount - analytics.total_paid_amount;

        res.json({
            total_assignments_count: analytics.total_assignments_count || 0,
            total_agreed_amount: analytics.total_agreed_amount || 0,
            total_paid_amount: analytics.total_paid_amount || 0,
            balance_owed: balance_owed || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
