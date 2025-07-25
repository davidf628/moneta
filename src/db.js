import mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

export async function load_preferences(user) {
    let conn;
    let payload;
    try {
        conn = await pool.getConnection();
        // rows is de-structured to eliminate extra metadata returned by mariadb when
        // a query is executed
        const [rows] = await conn.query('SELECT * FROM preferences WHERE user = ?', [user]);
        payload = rows;
    } catch (err) {
        console.error(err);
        payload = null;
    } finally {
        if (conn) conn.release();
        return payload;
    }
}