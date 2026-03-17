const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = process.env.ELECTRON_USER_DATA
  ? path.join(process.env.ELECTRON_USER_DATA, 'data')
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const DatabaseLoader = require('./init-db');
const db = DatabaseLoader(dbPath);

const pool = {
  query: async (sql, params = []) => {
    try {
      // Simple MySQL to SQLite translations
      let translatedSql = sql
        .replace(/SELECT\s+DATABASE\(\)\s+as\s+db/gi, "SELECT 'sqlite' as db")
        .replace(/DATABASE\(\)/gi, "'sqlite'")
        .replace(/CURDATE\(\)/gi, "date('now', 'localtime')")
        .replace(/DATE_ADD\(date\('now', 'localtime'\), INTERVAL 30 DAY\)/gi, "date('now', 'localtime', '+30 days')")
        .replace(/DATE_ADD\(CURDATE\(\), INTERVAL 30 DAY\)/gi, "date('now', 'localtime', '+30 days')")
        .replace(/COALESCE\(SUM\((.*?)\),0\)/gi, "COALESCE(SUM($1), 0)")
        .replace(/DESCRIBE\s+(\w+)/gi, "PRAGMA table_info($1)")
        .replace(/SHOW TABLES/gi, "SELECT name AS Tables_in_sqlite FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .replace(/SHOW TRIGGERS/gi, "SELECT name FROM sqlite_master WHERE type='trigger'")
        .replace(/YEAR\((.*?)\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");

      const stmt = db.prepare(translatedSql);
      const sqlUpper = translatedSql.trim().toUpperCase();

      if (sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('PRAGMA') || sqlUpper.startsWith('SHOW')) {
        const rows = stmt.all(params);
        if (sqlUpper.startsWith('PRAGMA TABLE_INFO')) {
          const mappedRows = rows.map(r => ({
            Field: r.name,
            Type: r.type,
            Null: r.notnull ? 'NO' : 'YES',
            Key: r.pk ? 'PRI' : '',
            Default: r.dflt_value,
            Extra: ''
          }));
          return [mappedRows, null];
        }
        return [rows, null];
      } else {
        const info = stmt.run(params);
        return [{ insertId: info.lastInsertRowid, affectedRows: info.changes }, null];
      }
    } catch (err) {
      console.log('\x1b[31m%s\x1b[0m', '--- QUERY FAILED (SQLite) ---');
      console.error('SQL:', sql);
      console.error('ERROR:', err.message || err);
      throw err;
    }
  },
  execute: async (sql, params = []) => {
    return pool.query(sql, params);
  },
  getConnection: async () => {
    return {
      query: pool.query,
      execute: pool.execute,
      beginTransaction: async () => {
        try {
          db.exec('BEGIN TRANSACTION');
        } catch (e) {
          if (!e.message.includes('within a transaction')) throw e;
        }
      },
      commit: async () => {
        try {
          db.exec('COMMIT TRANSACTION');
        } catch (e) {
          if (!e.message.includes('no transaction is active')) throw e;
        }
      },
      rollback: async () => {
        try {
          db.exec('ROLLBACK TRANSACTION');
        } catch (e) {
          if (!e.message.includes('no transaction is active')) throw e;
        }
      },
      release: () => { /* No-op for SQLite mock */ }
    };
  }
};

module.exports = pool;
