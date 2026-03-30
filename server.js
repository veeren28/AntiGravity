const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database on startup
initDB();

// GET total balance
app.get('/api/balance', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT SUM(balance) as totalBalance FROM Accounts');
        // PostgreSQL forces aggregate aliases to lowercase
        const balance = rows[0].totalbalance || 0;
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET recent transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM Transactions ORDER BY date DESC LIMIT 50');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new transaction
app.post('/api/transactions', async (req, res) => {
    const { amount, category, date, description, account_id } = req.body;
    
    // Default to account_id 1 (Main Account) if not provided
    const targetAccount = account_id || 1;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert transaction
        const result = await client.query(
            'INSERT INTO Transactions (account_id, amount, category, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [targetAccount, amount, category, date, description]
        );

        // Update account balance
        await client.query(
            'UPDATE Accounts SET balance = balance + $1 WHERE id = $2',
            [amount, targetAccount]
        );

        await client.query('COMMIT');

        res.status(201).json({ id: result.rows[0].id, amount, category, date, description, account_id: targetAccount });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        // Must release client back to pool
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
