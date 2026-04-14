/**
 * Migration: make payments.shooting_id nullable
 * Run once with: node migrate_payments.js
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new Database(dbPath);

console.log('Checking payments table schema...');
const cols = db.prepare("PRAGMA table_info(payments)").all();
const shootingCol = cols.find(c => c.name === 'shooting_id');

if (!shootingCol) {
    console.log('ERROR: shooting_id column not found.');
    process.exit(1);
}

if (!shootingCol.notnull) {
    console.log('shooting_id is already nullable. No migration needed.');
    process.exit(0);
}

console.log('shooting_id is NOT NULL. Migrating...');

db.exec(`PRAGMA foreign_keys = OFF;`);

db.exec(`
    BEGIN TRANSACTION;

    -- Step 1: rename old table
    ALTER TABLE payments RENAME TO payments_old;

    -- Step 2: create new table with shooting_id nullable
    CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shooting_id INTEGER,
        facture_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TEXT NOT NULL,
        method TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shooting_id) REFERENCES shootings(id),
        FOREIGN KEY (facture_id) REFERENCES factures(id)
    );

    -- Step 3: copy data
    INSERT INTO payments SELECT * FROM payments_old;

    -- Step 4: drop old table
    DROP TABLE payments_old;

    COMMIT;
`);

console.log('Migration complete. payments.shooting_id is now nullable.');
db.close();
