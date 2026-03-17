const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const DatabaseLoader = require('./init-db');
const db = DatabaseLoader(dbPath);

const pool = {
  query: async (sql, params = []) => {
    console.log('\x1b[33m%s\x1b[0m', '--- SQL QUERY (SQLite) ---');
    console.log(sql);
    if (params && params.length > 0) console.log('Params:', JSON.stringify(params));

    try {
      // Simple MySQL to SQLite translations for common patterns
      let translatedSql = sql
        .replace(/SELECT\s+DATABASE\(\)\s+as\s+db/gi, "SELECT 'sqlite' as db")
        .replace(/DATABASE\(\)/gi, "'sqlite'")
        .replace(/CURDATE\(\)/gi, "date('now')")
        .replace(/DATE_ADD\(CURDATE\(\), INTERVAL 30 DAY\)/gi, "date('now', '+30 days')")
        .replace(/COALESCE\(SUM\((.*?)\),0\)/gi, "COALESCE(SUM($1), 0)")
        .replace(/DESCRIBE\s+(\w+)/gi, "PRAGMA table_info($1)")
        .replace(/SHOW TABLES/gi, "SELECT name AS Tables_in_sqlite FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .replace(/SHOW TRIGGERS/gi, "SELECT name FROM sqlite_master WHERE type='trigger'");

      const stmt = db.prepare(translatedSql);
      const sqlUpper = translatedSql.trim().toUpperCase();

      if (sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('PRAGMA') || sqlUpper.startsWith('SHOW')) {
        const rows = stmt.all(params);
        // PRAGMA table_info returns columns: name, type, notnull, dflt_value, pk
        // MySQL DESCRIBE returns: Field, Type, Null, Key, Default, Extra
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
      console.error(err.message || err);
      throw err;
    }
  },
  execute: async (sql, params = []) => {
    return pool.query(sql, params);
  }
};

module.exports = pool;
