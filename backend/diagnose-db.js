const pool = require('./db/connection');

async function diagnose() {
    try {
        console.log('--- DATABASE DIAGNOSIS ---');
        const [dbs] = await pool.query('SELECT DATABASE() as db');
        console.log('Current Database:', dbs[0].db);

        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        const tablesToDescribe = [
            'clients',
            'company_info',
            'devis',
            'factures',
            'freelancers',
            'invoice_items',
            'payments',
            'shooting_freelancers',
            'shootings'
        ];

        for (const table of tablesToDescribe) {
            const [cols] = await pool.query(`DESCRIBE ${table}`);
            console.log(`\n--- ${table} columns ---`);
            console.table(cols);
        }

        const [triggers] = await pool.query('SHOW TRIGGERS');
        console.log('\n--- triggers ---');
        console.table(triggers);

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis failed:', err);
        process.exit(1);
    }
}

diagnose();
