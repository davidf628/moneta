import express from 'express';
import { load_preferences, pool } from './src/db.js';
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
        // load current budget items
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM budgetitems");
        res.render('budget-items', { budget_items: rows });
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