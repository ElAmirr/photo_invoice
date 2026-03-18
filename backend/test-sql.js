const pool = require('./db/connection');

async function test() {
    try {
        console.log('Testing SQL translations...');
        const year = 2026;

        // Test YEAR()
        const sql1 = "SELECT COUNT(*) as cnt FROM devis WHERE YEAR(date) = ?";
        console.log('Original SQL:', sql1);
        const [rows1] = await pool.query(sql1, [year]);
        console.log('Result:', rows1);

        // Test CURDATE()
        const sql2 = "SELECT date('now') as d";
        const [rows2] = await pool.query(sql2);
        console.log('SQLite date:', rows2);

        // Test UPDATE with double quotes
        console.log('Testing UPDATE with double quotes...');
        try {
            await pool.query('UPDATE devis SET status="accepted" WHERE id=9999');
            console.log('SUCCESS (Wait, why did this work?)');
        } catch (e) {
            console.log('FAILED (Expected for SQLite):', e.message);
        }

        console.log('DONE');
    } catch (err) {
        console.error('TEST FAILED:', err);
    }
}

test();
