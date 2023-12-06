'use server';
import { Pool } from 'pg';
import { format } from 'date-fns';
import dotenv from 'dotenv';
import { memoize } from 'lodash';

// Database Client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_READER_USER,
    password: process.env.DB_READER_PASSWORD,
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

export async function notesForParticipantOffset(participantId: string, offset: number) {
    const result = await pool.query('SELECT * FROM notes_with_stats WHERE note_author_participant_id = $1 ORDER BY created_at_millis DESC LIMIT 10 OFFSET $2', [participantId, offset]);
    return result.rows;
}

export async function ratingsForParticipantOffset(participantId: string, offset: number) {
    const result = await pool.query('SELECT n.*, r.*, r.created_at_millis AS rating_created_at_millis FROM ratings r LEFT JOIN notes_with_stats n ON r.note_id = n.note_id WHERE rating_participant_id = $1 ORDER BY r.created_at_millis DESC LIMIT 10 OFFSET $2', [participantId, offset]);
    return result.rows;
}

export async function participant(participantId: string) {
    const result = await pool.query('SELECT * FROM user_enrollment WHERE participant_id = $1', [participantId]);
    return result.rows[0];
}

export async function queryDatabase(query: string): Promise<any[]> {
    const result = await pool.query(query);
    return result.rows;
}