const pool = require('../db/connection');

exports.getAll = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = "SELECT * FROM expenses WHERE 1=1";
        let params = [];
        if (startDate && endDate) {
            query += " AND date BETWEEN ? AND ?";
            params.push(startDate, endDate);
        }
        query += " ORDER BY date DESC";
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { category, amount, date, description } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO expenses (category, amount, date, description) VALUES (?, ?, ?, ?)",
            [category, amount, date, description]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { category, amount, date, description } = req.body;
    try {
        await pool.query(
            "UPDATE expenses SET category=?, amount=?, date=?, description=? WHERE id=?",
            [category, amount, date, description, id]
        );
        res.json({ message: "Expense updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM expenses WHERE id=?", [id]);
        res.json({ message: "Expense deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM expense_categories ORDER BY name ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCategory = async (req, res) => {
    const { name } = req.body;
    try {
        const [result] = await pool.query("INSERT INTO expense_categories (name) VALUES (?)", [name]);
        res.status(201).json({ id: result.insertId, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await pool.query("UPDATE expense_categories SET name=? WHERE id=?", [name, id]);
        res.json({ message: "Category updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM expense_categories WHERE id=?", [id]);
        res.json({ message: "Category deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
