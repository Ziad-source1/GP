const mysql = require('mysql2');

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "coldBad1@",
  database: "levelup_db",
  waitForConnections: true,
  connectionLimit: 10
});

const db = pool.promise();

db.getConnection()
  .then(conn => {
    console.log('✅ Database connected');
    conn.release();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

module.exports = db;