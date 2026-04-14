const pool = require('../db/connection');

exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = "";
        let params = [];

        if (startDate && endDate) {
            dateFilter = " WHERE date BETWEEN ? AND ?";
            params = [startDate, endDate];
        }

        // 1. Invoiced Revenue (Sum of all factures)
        const [factureTotal] = await pool.query(
            `SELECT COALESCE(SUM(total_amount),0) AS total, COALESCE(SUM(tax_amount),0) AS total_tax FROM factures${dateFilter}`,
            params
        );
        const invoicedRevenue = parseFloat(factureTotal[0].total);
        const totalTax = parseFloat(factureTotal[0].total_tax);

        // 2. Received Revenue (Tunisian Workflow Split)
        let payDateFilter = "";
        let payParams = [];
        if (startDate && endDate) {
            payDateFilter = " AND payment_date BETWEEN ? AND ?";
            payParams = [startDate, endDate];
        }

        // Legal Channel: Payments linked to a formal Facture
        const [[legalRevRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE facture_id IS NOT NULL${payDateFilter}`,
            payParams
        );
        const legalRevenue = parseFloat(legalRevRow.total);

        // Private Channel: Payments linked to a shooting but NO facture
        const [[privateRevRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE shooting_id IS NOT NULL AND facture_id IS NULL${payDateFilter}`,
            payParams
        );
        const privateRevenue = parseFloat(privateRevRow.total);

        // Total Received (For Profit Calculation)
        const [[receivedTotalRow]] = await pool.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE 1=1${payDateFilter}`,
            payParams
        );
        const receivedRevenue = parseFloat(receivedTotalRow.total);

        // 3. Outstanding Revenue (Encours Breakdown) - REMAINING GLOBAL
        // We keep Encours global as it represents what is owed "right now"
        const [[globalInvoicedRow]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM factures");
        const [[globalLegalPaidRow]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE facture_id IS NOT NULL");
        const globalInvoiced = parseFloat(globalInvoicedRow.total);
        const globalLegalPaid = parseFloat(globalLegalPaidRow.total);
        const legalEncours = globalInvoiced - globalLegalPaid;

        // Private Encours: Total price of shootings NOT yet invoiced minus payments for them
        const [[privateValueRow]] = await pool.query(`
            SELECT COALESCE(SUM(total_price), 0) AS total 
            FROM shootings 
            WHERE NOT EXISTS (SELECT 1 FROM factures WHERE shootings.id = factures.shooting_id)
            AND status != 'cancelled'
        `);
        const [[privatePaidRow]] = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) AS total 
            FROM payments 
            WHERE facture_id IS NULL 
            AND shooting_id IN (
                SELECT id FROM shootings 
                WHERE NOT EXISTS (SELECT 1 FROM factures WHERE shootings.id = factures.shooting_id)
                AND status != 'cancelled'
            )
        `);
        const privateEncours = parseFloat(privateValueRow.total) - parseFloat(privatePaidRow.total);

        // 4. Unpaid invoices count
        const [[unpaid]] = await pool.query(
            "SELECT COUNT(*) AS count FROM factures WHERE status='unpaid'"
        );

        // 5. Upcoming shootings (next 30 days)
        const [[upcoming]] = await pool.query(
            "SELECT COUNT(*) AS count FROM shootings WHERE status='scheduled' AND shooting_date >= CURDATE() AND shooting_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
        );

        // 6. Total freelancer costs paid in period
        const [[freelancerCosts]] = await pool.query(
            `SELECT COALESCE(SUM(paid_amount),0) AS total FROM shooting_freelancers WHERE shooting_id IN (SELECT id FROM shootings WHERE shooting_date BETWEEN ? AND ?)`,
            [startDate || '1970-01-01', endDate || '2099-12-31']
        );

        // 7. Total business expenses in period
        const [[expensesTotal]] = await pool.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM expenses${dateFilter}`,
            params
        );

        const profit = receivedRevenue - parseFloat(freelancerCosts.total) - parseFloat(expensesTotal.total);

        // Upcoming Payments (What I owe to freelancers)
        const [upcomingPayments] = await pool.query(`
            SELECT sf.*, f.name AS freelancer_name, s.title AS shooting_title
            FROM shooting_freelancers sf
            JOIN freelancers f ON sf.freelancer_id = f.id
            JOIN shootings s ON sf.shooting_id = s.id
            WHERE sf.agreed_amount > sf.paid_amount
            LIMIT 5
        `);

        // Prochains Encaissements (STRICTLY Unpaid Factures only)
        const [upcomingPaycheck] = await pool.query(`
            SELECT f.*, c.name AS client_name
            FROM factures f
            JOIN clients c ON f.client_id = c.id
            WHERE f.status != 'paid'
            ORDER BY f.date ASC
            LIMIT 5
        `);
        // 8. Pending Devis Total
        const [[pendingDevis]] = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) AS total FROM devis WHERE status = 'pending'"
        );

        res.json({
            legalRevenue,
            privateRevenue,
            totalTax,
            legalEncours,
            privateEncours,
            receivedRevenue,
            unpaidCount: unpaid.count,
            upcomingShootings: upcoming.count,
            profit,
            expensesTotal: parseFloat(expensesTotal.total),
            pendingDevisAmount: parseFloat(pendingDevis.total),
            upcomingPayments,
            upcomingPaycheck,
            recentShootings: [],
            recentFactures: [],
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
