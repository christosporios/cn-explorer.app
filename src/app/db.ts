'use server';
import { Pool } from 'pg';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import { memoize } from 'lodash';

// Database Client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});


export async function lastRatingDate() {
    const result = await pool.query('SELECT MAX(created_at_millis) FROM ratings');
    const lastDate = parseInt(result.rows[0].max);

    return new Date(lastDate);
}

export async function countRatings() {
    const result = await pool.query('SELECT COUNT(*) FROM ratings');
    console.log("foo");
    return parseInt(result.rows[0].count);
}

export async function notesForTweetId(tweetId: string) {
    const result = await pool.query('SELECT * FROM notes_with_stats WHERE tweet_id = $1', [tweetId]);
    return result.rows;
}