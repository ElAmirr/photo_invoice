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
        const { name, address, phone, email, matricule_fiscale, patente } = req.body;
        const logo = req.file ? `/uploads/${req.file.filename}` : req.body.logo;
        const [rows] = await pool.query('SELECT id FROM company_info LIMIT 1');
        if (rows.length > 0) {
            await pool.query(
                'UPDATE company_info SET name=?, address=?, phone=?, email=?, matricule_fiscale=?, patente=?, logo=? WHERE id=?',
                [name, address, phone, email, matricule_fiscale, patente, logo, rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO company_info (name, address, phone, email, matricule_fiscale, patente, logo) VALUES (?,?,?,?,?,?,?)',
                [name, address, phone, email, matricule_fiscale, patente, logo]
            );
        }
        const [updated] = await pool.query('SELECT * FROM company_info LIMIT 1');
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
