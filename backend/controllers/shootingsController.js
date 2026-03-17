const pool = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT s.*, c.name AS client_name,
        COALESCE(SUM(p.amount),0) AS total_paid
      FROM shootings s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN payments p ON p.shooting_id = s.id
      GROUP BY s.id
      ORDER BY s.shooting_date DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT s.*, c.name AS client_name,
        COALESCE(SUM(p.amount),0) AS total_paid
      FROM shootings s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN payments p ON p.shooting_id = s.id
      WHERE s.id=?
      GROUP BY s.id
    `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });

        // Get freelancers assigned
        const [freelancers] = await pool.query(`
      SELECT sf.*, f.name, f.phone, f.specialty
      FROM shooting_freelancers sf
      JOIN freelancers f ON sf.freelancer_id = f.id
      WHERE sf.shooting_id=?
    `, [req.params.id]);

        // Get payments
        const [payments] = await pool.query(
            'SELECT * FROM payments WHERE shooting_id=? ORDER BY payment_date ASC',
            [req.params.id]
        );

        res.json({ ...rows[0], freelancers, payments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { client_id, title, shooting_date, location, total_price, status } = req.body;
        const [result] = await pool.query(
            'INSERT INTO shootings (client_id, title, shooting_date, location, total_price, status) VALUES (?,?,?,?,?,?)',
            [client_id, title, shooting_date, location, total_price, status || 'scheduled']
        );
        const [rows] = await pool.query('SELECT * FROM shootings WHERE id=?', [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { client_id, title, shooting_date, location, total_price, status } = req.body;
        await pool.query(
            'UPDATE shootings SET client_id=?, title=?, shooting_date=?, location=?, total_price=?, status=? WHERE id=?',
            [client_id, title, shooting_date, location, total_price, status, req.params.id]
        );
        const [rows] = await pool.query('SELECT * FROM shootings WHERE id=?', [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM shootings WHERE id=?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Assign freelancer to shooting
exports.assignFreelancer = async (req, res) => {
    try {
        const { freelancer_id, agreed_amount, paid_amount } = req.body;
        const [existing] = await pool.query(
            'SELECT id FROM shooting_freelancers WHERE shooting_id=? AND freelancer_id=?',
            [req.params.id, freelancer_id]
        );
        if (existing.length) {
            await pool.query(
                'UPDATE shooting_freelancers SET agreed_amount=?, paid_amount=? WHERE shooting_id=? AND freelancer_id=?',
                [agreed_amount, paid_amount || 0, req.params.id, freelancer_id]
            );
        } else {
            await pool.query(
                'INSERT INTO shooting_freelancers (shooting_id, freelancer_id, agreed_amount, paid_amount) VALUES (?,?,?,?)',
                [req.params.id, freelancer_id, agreed_amount, paid_amount || 0]
            );
        }
        res.json({ message: 'Freelancer assigned' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeFreelancer = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM shooting_freelancers WHERE shooting_id=? AND freelancer_id=?',
            [req.params.id, req.params.freelancerId]
        );
        res.json({ message: 'Removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFreelancerPayment = async (req, res) => {
    try {
        const { paid_amount } = req.body;
        await pool.query(
            'UPDATE shooting_freelancers SET paid_amount=? WHERE shooting_id=? AND freelancer_id=?',
            [paid_amount, req.params.id, req.params.freelancerId]
        );
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
