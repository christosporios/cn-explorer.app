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
  console.log('lastRatingDate', lastDate);

  return new Date(lastDate);
}