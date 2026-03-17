const pool = require('../db/connection');

exports.getStats = async (req, res) => {
    try {
        // Revenue = Sum of all payments (which includes shooting advances)
        // PLUS sum of total_amount from 'paid' factures that are NOT linked to a shooting (to avoid double counting)
        const [[factureIncome]] = await pool.query(
            "SELECT COALESCE(SUM(total_amount),0) AS total FROM factures WHERE status='paid' AND shooting_id IS NULL"
        );
        const [[clientPayments]] = await pool.query(
            "SELECT COALESCE(SUM(amount),0) AS total FROM payments"
        );

        const totalRevenue = parseFloat(factureIncome.total) + parseFloat(clientPayments.total);

        // Unpaid invoices count
        const [[unpaid]] = await pool.query(
            "SELECT COUNT(*) AS count FROM factures WHERE status='unpaid'"
        );

        // Upcoming shootings (next 30 days)
        const [[upcoming]] = await pool.query(
            "SELECT COUNT(*) AS count FROM shootings WHERE status='scheduled' AND shooting_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
        );

        // Total freelancer costs paid
        const [[freelancerCosts]] = await pool.query(
            "SELECT COALESCE(SUM(paid_amount),0) AS total FROM shooting_freelancers"
        );

        const profit = totalRevenue - parseFloat(freelancerCosts.total);

        // Recent shootings (last 5)
        const [recentShootings] = await pool.query(`
      SELECT s.*, c.name AS client_name,
        COALESCE(SUM(p.amount),0) AS total_paid,
        (SELECT COALESCE(SUM(agreed_amount),0) FROM shooting_freelancers WHERE shooting_id = s.id) AS total_freelancer_cost
      FROM shootings s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN payments p ON p.shooting_id = s.id
      GROUP BY s.id
      ORDER BY s.shooting_date DESC
      LIMIT 5
    `);

        // Recent factures
        const [recentFactures] = await pool.query(`
      SELECT f.*, c.name AS client_name
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      ORDER BY f.id DESC
      LIMIT 5
    `);

        res.json({
            totalRevenue,
            unpaidCount: unpaid.count,
            upcomingShootings: upcoming.count,
            profit,
            totalClientPayments: totalRevenue,
            recentShootings,
            recentFactures,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
