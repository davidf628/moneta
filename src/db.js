import mariadb from 'mariadb';
import dotenv from 'dotenv';

import { sort_months } from './misc.js'

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


// Gets the names of the different accounts available within the database
export async function get_accounts() {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let accounts = await conn.query('SELECT name FROM accounts');
        for (let account of accounts) {
            payload.push(account.name);
        }
    } catch (err) {
        console.error(err);
        payload = null;
    } finally {
        if (conn) conn.release();
        return payload;
    }
}

// Looks into the budgetitems database and the transactions database to see
// what years are available and combines those into a single list. Finally,
// this list gets sorted and returned back to the main program
export async function get_available_years() {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let years = await conn.query('SELECT DISTINCT year FROM budgetitems');
        for (let year of years) {
            payload.push(year.year);
        }
        years = await conn.query('SELECT DISTINCT year FROM transactions');
        for (let year of years) {
            if (!year.year in payload) {
                payload.push(year.year);
            }
        }
        payload.sort((a, b) => b - a);
    } catch (err) {
        console.error(err);
        payload = null;
    } finally {
        if (conn) conn.release();
        return payload;
    }
}


// For a given year, this function pulls all the months associated with that
// year in the database. This looks into both the budgetitems and transactions
// database in case there are different values (though there shouldn't be.) 
// The return is sorted by calendar appearance
export async function get_avaiable_months(year) {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let months = await conn.query('SELECT DISTINCT month FROM budgetitems WHERE year = ?', [year]);
        for (let month of months) {
            payload.push(month.month);
        }
        months = await conn.query('SELECT DISTINCT month FROM transactions WHERE year = ?', [year]);
        for (let month of months) {
            if (!month.month in months) {
                payload.push(month.month);
            }
        }
        payload = sort_months(payload);
    } catch (err) {
        console.error(err);
        payload = null;
    } finally {
        if (conn) conn.release();
        return payload;
    }
}