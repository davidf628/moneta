import express from 'express';
import { get_accounts, 
         get_avaiable_months, 
         get_available_years, 
         load_preferences, 
         save_preferences, 
         pool 
       } from './src/db.js';
import { get_property_list, lookup_by_id, lookup_id_by } from './src/misc.js';
import bodyParser from 'body-parser';

const app = express();
const PORT = 8600;

// EJS as the template engine
app.set('view engine', 'ejs');

// populates a variable called req.body if the user
// is submitting a form. (The extended option is 
// required)
app.use(bodyParser.urlencoded({ extended: false }));

// Route: fetch users and render template
app.get('/', async (req, res) => {
    let conn;
    try {

        // load user preferences
        let user = 'davidflenner';
        let prefs = await load_preferences(user);
        if (prefs == null) {
            res.status(500).send(`Could not load preferences for user ${user}`);
        }

        if (req.query.month) {
            // TODO: validate that req.query.month is a valid Month
            prefs.current_month = req.query.month;
            await save_preferences(user, prefs);
        }

        if (req.query.account) {
            // TODO: validate that req.query.account is a valid Account
            let accounts = await get_accounts();
            let account_id = lookup_id_by(accounts, req.query.account, 'name');
            prefs.current_account = account_id;
            await save_preferences(user, prefs);
        }

        if (req.query.year) {
            // TODO: validate that req.query.year is a valid Year
            prefs.current_year = req.query.year;
            await save_preferences(user, prefs);
        }

        // load all available accounts in the database
        let accounts = await get_accounts();
        if (accounts == null) {
            res.status(500).send(`Could not load any accounts from the database`);
        }

        // load all years available in the database
        let years = await get_available_years(prefs.current_account);
        if (years == null) {
            res.status(500).send(`Could not load any years for the account ${prefs.current_account}`);
        }

        // load all months avaialbe for the current year
        let months = await get_avaiable_months(prefs.current_account, prefs.current_year);
        if (months == null) {
            res.status(500).send(`Could not find any months for year ${prefs.current_year} in the account ${prefs.current_account}`);
        }

        // load current budget items
        // each item will have: id, name, amount, orderbyte, increment, year, month, account
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM budgetitems WHERE account = ? AND month = ? AND year = ?", 
            [prefs.current_account, prefs.current_month, prefs.current_year]);

        let payload = {
            budget_items: rows,
            prefs: prefs,
            current_account: lookup_by_id(accounts, prefs.current_account, 'name'),
            accounts: get_property_list(accounts, 'name'),
            months: months,
            years: years
        }

        res.render('budget-items', payload);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    } finally {
        if (conn) conn.release();
    }
});

// A request to create a new budget item has been made, take
// user to that page
app.get('/new-budget-item', (req, res) => {
    res.render('new-budget-item', {});
});

// after the user enters the new budget item data and POSTS
// it to the new-budget-item route, the server grabs this data
// and sends it to the database

app.post('/new-budget-item', (req, res) => {
    // input values: req.body['budget-category-title']
    //   and req.body['budget-amount']
    console.log(req.body);
    console.log(`${req.body.title}, ${req.body.amount}`);

    // take user back to homepage
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}\n` +
        `Press CTRL+C to quit.`
    );
});