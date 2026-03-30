const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    // Prioritize DATABASE_URL if the user sets it (common in Vercel/Render/Supabase)
    connectionString: process.env.DATABASE_URL,
    
    // Fallback options
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'finance_tracker',
    port: process.env.DB_PORT || 5432,
    
    // SSL is often required for cloud databases
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Accounts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                balance DECIMAL(10, 2) DEFAULT 0.00
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Transactions (
                id SERIAL PRIMARY KEY,
                account_id INT REFERENCES Accounts(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                description TEXT
            )
        `);

        // Seed an initial "Main" account and sample transactions if none exist
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM Accounts');
        if (parseInt(rows[0].count) === 0) {
            // Insert Main Account
            const accountResult = await pool.query(
                'INSERT INTO Accounts (name, balance) VALUES ($1, $2) RETURNING id',
                ['Main Account', 5250.00]
            );
            const accountId = accountResult.rows[0].id;

            // Insert Sample Transactions
            const sampleTransactions = [
                [accountId, 5000.00, 'Salary', '2026-03-01', 'Monthly Salary'],
                [accountId, -150.00, 'Groceries', '2026-03-05', 'Walmart groceries'],
                [accountId, -50.00, 'Entertainment', '2026-03-10', 'Movie tickets'],
                [accountId, 200.00, 'Freelance', '2026-03-15', 'Web development project'],
                [accountId, -80.00, 'Dining', '2026-03-20', 'Dinner at restaurant'],
                [accountId, 330.00, 'Refund', '2026-03-25', 'Tax refund']
            ];

            for (const t of sampleTransactions) {
                await pool.query(
                    'INSERT INTO Transactions (account_id, amount, category, date, description) VALUES ($1, $2, $3, $4, $5)',
                    t
                );
            }

            console.log('Seeded Main Account and sample transactions.');
        }

        console.log('Database tables successfully initialized for PostgreSQL.');
    } catch (err) {
        console.error('Error initializing PostgreSQL tables:', err.message);
    }
}

module.exports = { pool, initDB };
