import Redis from 'ioredis';
import { lastRatingDate, lastNoteDate, countNotes, countRatings, countUsers, queryDatabase } from '../app/db';
import dotenv from 'dotenv';
import { QueryStatus } from '@/app/api/search';
import { generateSqlQuery } from '@/app/api/gpt';
dotenv.config();

const redis = new Redis(process.env.REDIS_URL!);

type DBStats = {
    lastRatingDate: Date,
    lastNoteDate: Date,
    countNotes: number,
    countRatings: number,
    countUsers: number
};

const getStats = async (): Promise<DBStats> => {
    return {
        lastRatingDate: await lastRatingDate(),
        lastNoteDate: await lastNoteDate(),
        countNotes: await countNotes(),
        countRatings: await countRatings(),
        countUsers: await countUsers()
    };
};

const saveStatsToRedis = async () => {
    const stats = await getStats();
    await redis.set('stats', JSON.stringify(stats));
    console.log('Stats saved to Redis:', stats);
};

const startSavingStats = (interval: number) => {
    saveStatsToRedis();
    setInterval(async () => {
        try {
            await saveStatsToRedis();
        } catch (error) {
            console.error('Error saving stats to Redis:', error);
        }
    }, interval);
};

const executeQuery = async (sqlQuery: string) => {
    try {
        var results = await queryDatabase(sqlQuery);
    } catch (e) {
        console.log(e);
        return {
            type: "error",
            error: "Could not execute query"
        }
    }

    if (sqlQuery.startsWith("SELECT * FROM notes_with_stats")) {
        return {
            type: "notes-list",
            notes: results
        }
    }

    /*
    if (sqlQuery.startsWith("SELECT * FROM ratings")) {
      return {
        type: "ratings",
        ratings: results
      }
    }
    */

    return {
        type: "table",
        results
    }
}

const processQuery = async (key: string, status: QueryStatus) => {
    if (status.status === "created") {
        console.log('Processing query for key:', key);
        // Generate SQL query
        redis.set(key, JSON.stringify({ ...status, status: "generating-sql" }));
        let start = Date.now();
        try {
            var sqlQuery = await generateSqlQuery(status.query!);
        } catch (e) {
            console.log(e);
            redis.set(key, JSON.stringify({ ...status, status: "error", error: "Could not generate SQL for this query" }));
            return;
        }
        let generationTime = Date.now() - start;

        // Execute SQL query
        redis.set(key, JSON.stringify({ ...status, status: "executing", sqlQuery, times: { generation: generationTime, execution: 0 } }));
        start = Date.now();
        try {
            var results = await executeQuery(sqlQuery);
        } catch (e) {
            console.log(e);
            redis.set(key, JSON.stringify({ ...status, status: "error", sqlQuery, error: "Could not execute query" }));
            return;
        }
        console.log('Results:', results)
        let executionTime = Date.now() - start;
        redis.set(key, JSON.stringify({ ...status, status: "done", sqlQuery, results, times: { generation: generationTime, execution: executionTime } }));
    }
};


const processQueries = async () => {
    const keys = await redis.keys('QUERY:*');
    for (const key of keys) {
        const query = await redis.get(key);
        if (!query) {
            continue;
        }
        let status = JSON.parse(query) as QueryStatus;
        if (status.status === 'done' || status.status === 'error') {
            continue;
        }

        processQuery(key, status);
    }
};

const startProcessingQueries = (interval: number) => {
    setInterval(processQueries, interval);
}

// Graceful shutdown
process.on('SIGINT', () => {
    redis.quit();
    console.log('Redis connection closed');
    process.exit(0);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
    startSavingStats(300000); // every 5 minutes
    startProcessingQueries(1000);
});
