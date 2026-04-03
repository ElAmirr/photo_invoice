const pool = require('../db/connection');

// GET /api/company
exports.getCompany = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM company_info LIMIT 1');
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/company
exports.updateCompany = async (req, res) => {
    try {
        const { name, address, phone, email, matricule_fiscale, patente, bank_name, account_number } = req.body;
        const logo = req.file ? `/uploads/${req.file.filename}` : req.body.logo;
        const [rows] = await pool.query('SELECT id FROM company_info LIMIT 1');
        if (rows.length > 0) {
            await pool.query(
                'UPDATE company_info SET name=?, address=?, phone=?, email=?, matricule_fiscale=?, patente=?, logo=?, bank_name=?, account_number=? WHERE id=?',
                [name, address, phone, email, matricule_fiscale, patente, logo, bank_name, account_number, rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO company_info (name, address, phone, email, matricule_fiscale, patente, logo, bank_name, account_number) VALUES (?,?,?,?,?,?,?,?,?)',
                [name, address, phone, email, matricule_fiscale, patente, logo, bank_name, account_number]
            );
        }
        const [updated] = await pool.query('SELECT * FROM company_info LIMIT 1');
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
