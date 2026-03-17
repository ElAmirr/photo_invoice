const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    console.log('Testing connection with:');
    console.log('User:', process.env.DB_USER);
    console.log('Host:', process.env.DB_HOST);
    console.log('DB:', process.env.DB_NAME);
    console.log('Pass Length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'photographer_management'
        });
        console.log('CONNECTION SUCCESSFUL!');
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('QUERY SUCCESSFUL! Result:', rows[0].result);
        await connection.end();
    } catch (err) {
        console.error('CONNECTION FAILED:', err.message);
    }
}

test();
