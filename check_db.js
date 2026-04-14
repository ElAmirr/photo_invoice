const pool = require('./backend/db/connection');
async function check() {
    try {
        const [rows] = await pool.query('SELECT id, reference, total_amount, status FROM factures LIMIT 20');
        console.log('Factures:');
        for (const r of rows) {
            const [payments] = await pool.query('SELECT SUM(amount) as s FROM payments WHERE facture_id = ? OR shooting_id = ?', [r.id, r.shooting_id]);
            console.log(`ID: ${r.id}, Ref: ${r.reference}, Total: ${r.total_amount}, DB Status: ${r.status}, Paid: ${payments[0].s || 0}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
