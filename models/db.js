import mysql from "mysql";
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "coldBad1@",
  database: "levelup_db",
});
db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
    console.log(err);
    return;
  }
  console.log("Database connected successfully");
});
export default db;
