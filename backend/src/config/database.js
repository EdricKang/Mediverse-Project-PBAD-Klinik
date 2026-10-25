const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const { applyMigrations } = require('./migrations');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const initSQL = fs.readFileSync(
  path.join(__dirname, '../sql_scripts/init.sql'),
  'utf8'
);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal konek SQLite:', err.message);
    process.exit(1);
  }

  console.log('✅ Terhubung ke SQLite:', dbPath);
});

const initializeDatabase = () =>
  new Promise((resolve, reject) => {
    db.exec(initSQL, async (err) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        await applyMigrations(db);
        resolve();
      } catch (migrationError) {
        reject(migrationError);
      }
    });
  });

module.exports = {
  db,
  initializeDatabase,
};
