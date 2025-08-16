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

// loads the saved preferences for a user looked up by username.
// the preferences are returned as an object that looks like:
// { }

export async function load_preferences(user) {
    let conn;
    let payload;
    try {
        conn = await pool.getConnection();
        const prefs = await conn.query('SELECT * FROM preferences WHERE user = ?', [user]);
        payload = prefs[0]; // there should be only on item returned since usernames are unique
    } catch (err) {
        console.error(`{err}: Error while loading user preferences`);
        payload = null;
    } finally {
        if (conn) conn.release();
        return payload;
    }
}

// writes any preference changes to the database for use later
export async function save_preferences(user, prefs) {
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = 'UPDATE preferences SET current_month = ?, current_year = ?, current_account = ? WHERE user = ?';
        const params = [prefs.current_month, prefs.current_year, prefs.current_account, user];
        await conn.query(sql, params);
    } catch (err) {
        console.error(`${err}: Error while saving user preferences`);
    } finally {
        if (conn) conn.release();
    }
}


// Gets the names of the different accounts available within the database
// along with their associated id. This is returned as an array of objects
// that looks like: [ { name: 'acctname', id: ## }]
export async function get_accounts() {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let accounts = await conn.query('SELECT * FROM accounts');
        payload = accounts;
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
export async function get_available_years(account) {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let years = await conn.query('SELECT DISTINCT year FROM budgetitems WHERE account = ?', [account]);
        for (let year of years) {
            payload.push(year.year);
        }
        years = await conn.query('SELECT DISTINCT year FROM transactions WHERE account = ?', [account]);
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
export async function get_avaiable_months(account, year) {
    let conn, payload = [];
    try {
        conn = await pool.getConnection();
        let months = await conn.query('SELECT DISTINCT month FROM budgetitems WHERE account = ? AND year = ?', [account, year]);
        for (let month of months) {
            payload.push(month.month);
        }
        months = await conn.query('SELECT DISTINCT month FROM transactions WHERE account = ? AND year = ?', [account, year]);
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

export async function shift_db_item_up(table, id, user) {

    const allowedTables = ['budgetitems', 'transactions'];
    if (!allowedTables.includes(table)) {
        throw new Error(`Table: ${table} is not a valid table name`);
    }

    let conn;
    try {
        conn = await pool.getConnection();
        let prefs = await load_preferences(user);
        
        // get all budgetitems for current account, month, year
        let sql = `SELECT * FROM ${table} WHERE account = ? AND month = ? AND year = ? ORDER BY orderbyte`;
        let rows = await conn.query(sql, [prefs.current_account, prefs.current_month, prefs.current_year]);
        
        let moverow = rows.find(row => row.id == id);
        let neworderbyte = moverow.orderbyte - 1;
        let min_orderbyte = Math.min(...rows.map(row => row.orderbyte).filter(x => x >= 0));

        // for all items with orderbyte < moved item => leave alone
        // for all items with orderbyte > moved item => increase by one
        if (moverow.orderbyte > min_orderbyte) {
            rows.filter(row => row.orderbyte >= neworderbyte).forEach(row => row.orderbyte += 1);
            moverow.orderbyte = neworderbyte;
        }

        // re-sort all the rows by the orderbyte
        rows.sort((a, b) => a.orderbyte - b.orderbyte);

        // make sure there are no orderbyte gaps and starting value is 0
        let counter = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            if (row.orderbyte >= 0) {  i;
                row.orderbyte = counter;
                counter++;
            }
        }
        sql = `
            UPDATE ${table}
            SET orderbyte = 
                CASE id
                    ${rows.map(u => `WHEN ${u.id} THEN ${u.orderbyte}`).join(' ')}
                END
            WHERE id IN (${rows.map(u => u.id).join(', ')})
        `;
        await conn.query(sql);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
};

export async function shift_db_item_down(table, id, user) {
    let conn;

    const allowedTables = ['budgetitems', 'transactions'];
    if (!allowedTables.includes(table)) {
        throw new Error(`Table: ${table} is not a valid table name`);
    }

    try {
        conn = await pool.getConnection();
        let prefs = await load_preferences(user);
        
        // get all budgetitems for current account, month, year
        let sql = `SELECT * FROM ${table} WHERE account = ? AND month = ? AND year = ? ORDER BY orderbyte`;
        let rows = await conn.query(sql, [prefs.current_account, prefs.current_month, prefs.current_year]);
        
        // ignore all the the hidden items:
        rows = rows.filter(row => row.orderbyte >= 0);

        let moverow = rows.find(row => row.id == id);
        let moverowindex = rows.findIndex(row => row.id == id);
        if (moverowindex < rows.length - 1) {
            let nextrow = rows[moverowindex + 1];
            // swap the orderbytes of the moverow and the nextrow
            let saved_orderbyte = moverow.orderbyte;
            moverow.orderbyte = nextrow.orderbyte;
            nextrow.orderbyte = saved_orderbyte; 
       
            // re-sort all the rows by the orderbyte
            rows.sort((a, b) => a.orderbyte - b.orderbyte);

            // make sure there are no orderbyte gaps and starting value is 0
            let counter = 0;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                if (row.orderbyte >= 0) {  i;
                    row.orderbyte = counter;
                    counter++;
                }
            }
            const sql = `
                UPDATE ${table}
                SET orderbyte = 
                    CASE id
                        ${rows.map(u => `WHEN ${u.id} THEN ${u.orderbyte}`).join(' ')}
                    END
                WHERE id IN (${rows.map(u => u.id).join(', ')})
            `;
            await conn.query(sql);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
    }
};