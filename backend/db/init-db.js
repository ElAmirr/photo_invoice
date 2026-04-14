const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function initDb(dbPath) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(dbPath);
    console.log(`Connected to SQLite database at: ${dbPath}`);

    db.exec(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            matricule_fiscale TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS company_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            matricule_fiscale TEXT,
            patente TEXT,
            logo TEXT
        );

        CREATE TABLE IF NOT EXISTS shootings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            title TEXT,
            shooting_date TEXT NOT NULL,
            location TEXT,
            start_time TEXT,
            duration TEXT,
            total_price DECIMAL(10,2) DEFAULT 0.00,
            avance DECIMAL(10,2) DEFAULT 0.00,
            remaining DECIMAL(10,2) DEFAULT 0.00,
            status TEXT CHECK(status IN ('scheduled','completed','cancelled')) DEFAULT 'scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS devis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            reference TEXT UNIQUE,
            date TEXT NOT NULL,
            valid_until TEXT,
            title TEXT,
            subtotal_amount DECIMAL(10,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            total_amount DECIMAL(10,2) DEFAULT 0.00,
            status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        );

        CREATE TABLE IF NOT EXISTS factures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            devis_id INTEGER,
            reference TEXT UNIQUE,
            date TEXT NOT NULL,
            subtotal_amount DECIMAL(10,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            total_amount DECIMAL(10,2) DEFAULT 0.00,
            status TEXT CHECK(status IN ('unpaid','paid','partial')) DEFAULT 'unpaid',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            shooting_id INTEGER,
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (devis_id) REFERENCES devis(id),
            FOREIGN KEY (shooting_id) REFERENCES shootings(id)
        );

        CREATE TABLE IF NOT EXISTS freelancers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            specialty TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT CHECK(type IN ('devis','facture')) NOT NULL,
            parent_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            days INTEGER,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
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

        CREATE TABLE IF NOT EXISTS shooting_freelancers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shooting_id INTEGER NOT NULL,
            freelancer_id INTEGER NOT NULL,
            agreed_amount DECIMAL(10,2) DEFAULT 0.00,
            paid_amount DECIMAL(10,2) DEFAULT 0.00,
            FOREIGN KEY (shooting_id) REFERENCES shootings(id),
            FOREIGN KEY (freelancer_id) REFERENCES freelancers(id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expense_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // --- MIGRATIONS ---

    // 1. Payments: add facture_id
    const paymentsInfo = db.prepare("PRAGMA table_info(payments)").all();
    if (!paymentsInfo.some(col => col.name === 'facture_id')) {
        db.exec('ALTER TABLE payments ADD COLUMN facture_id INTEGER;');
        console.log('DB migration: added payments.facture_id');
    }

    // 2. Shootings: add start_time, duration
    const shootingsInfo = db.prepare("PRAGMA table_info(shootings)").all();
    if (!shootingsInfo.some(col => col.name === 'start_time')) {
        db.exec('ALTER TABLE shootings ADD COLUMN start_time TEXT;');
        db.exec('ALTER TABLE shootings ADD COLUMN duration TEXT;');
        console.log('DB migration: added shootings columns');
    }

    // 3. Devis: add title, subtotal_amount, tax_amount
    const devisInfo = db.prepare("PRAGMA table_info(devis)").all();
    if (!devisInfo.some(col => col.name === 'title')) {
        try { db.exec('ALTER TABLE devis ADD COLUMN title TEXT;'); } catch (e) { }
    }
    if (!devisInfo.some(col => col.name === 'subtotal_amount')) {
        try { db.exec('ALTER TABLE devis ADD COLUMN subtotal_amount DECIMAL(10,2) DEFAULT 0.00;'); } catch (e) { }
        try { db.exec('ALTER TABLE devis ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00;'); } catch (e) { }
        console.log('DB migration: added devis financial columns');
    }

    // 4. Factures: add subtotal_amount, tax_amount
    const facturesInfo = db.prepare("PRAGMA table_info(factures)").all();
    if (!facturesInfo.some(col => col.name === 'subtotal_amount')) {
        try { db.exec('ALTER TABLE factures ADD COLUMN subtotal_amount DECIMAL(10,2) DEFAULT 0.00;'); } catch (e) { }
        try { db.exec('ALTER TABLE factures ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00;'); } catch (e) { }
        console.log('DB migration: added factures financial columns');
    }

    // 5. Invoice Items: add days
    const itemsInfo = db.prepare("PRAGMA table_info(invoice_items)").all();
    if (!itemsInfo.some(col => col.name === 'days')) {
        try { db.exec('ALTER TABLE invoice_items ADD COLUMN days INTEGER;'); } catch (e) { }
        console.log('DB migration: added invoice_items.days');
    }

    // 6. Company Info: add bank_name, account_number
    const companyInfo = db.prepare("PRAGMA table_info(company_info)").all();
    if (!companyInfo.some(col => col.name === 'bank_name')) {
        try { db.exec('ALTER TABLE company_info ADD COLUMN bank_name TEXT;'); } catch (e) { }
    }
    if (!companyInfo.some(col => col.name === 'account_number')) {
        try { db.exec('ALTER TABLE company_info ADD COLUMN account_number TEXT;'); } catch (e) { }
        console.log('DB migration: added bank information columns to company_info');
    }

    // 7. Devis & Factures: add bon_commande
    const devisInfoBC = db.prepare("PRAGMA table_info(devis)").all();
    if (!devisInfoBC.some(col => col.name === 'bon_commande')) {
        try { db.exec('ALTER TABLE devis ADD COLUMN bon_commande TEXT;'); } catch (e) { }
    }
    const facturesInfoBC = db.prepare("PRAGMA table_info(factures)").all();
    if (!facturesInfoBC.some(col => col.name === 'bon_commande')) {
        try { db.exec('ALTER TABLE factures ADD COLUMN bon_commande TEXT;'); } catch (e) { }
        console.log('DB migration: added bon_commande columns to devis and factures');
    }

    // 8. Devis & Factures: add tva_suspended, suspension_number
    const devisTva = db.prepare("PRAGMA table_info(devis)").all();
    if (!devisTva.some(col => col.name === 'tva_suspended')) {
        try { db.exec('ALTER TABLE devis ADD COLUMN tva_suspended INTEGER DEFAULT 0;'); } catch (e) { }
    }
    if (!devisTva.some(col => col.name === 'suspension_number')) {
        try { db.exec('ALTER TABLE devis ADD COLUMN suspension_number TEXT;'); } catch (e) { }
    }
    const facturesTva = db.prepare("PRAGMA table_info(factures)").all();
    if (!facturesTva.some(col => col.name === 'tva_suspended')) {
        try { db.exec('ALTER TABLE factures ADD COLUMN tva_suspended INTEGER DEFAULT 0;'); } catch (e) { }
    }
    if (!facturesTva.some(col => col.name === 'suspension_number')) {
        try { db.exec('ALTER TABLE factures ADD COLUMN suspension_number TEXT;'); } catch (e) { }
        console.log('DB migration: added tva_suspended columns to devis and factures');
    }

    console.log('Successfully initialized database schema.');
    return db;
}

module.exports = initDb;
