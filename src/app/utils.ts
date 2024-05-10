'use server';
import { lastRatingDate, lastNoteDate, countNotes, countRatings, countUsers } from './db';
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

type DBStats = {
    lastRatingDate: Date,
    lastNoteDate: Date,
    countNotes: number,
    countRatings: number,
    countUsers: number
}

const getStatsFromRedis = async (): Promise<DBStats> => {
    const stats = await redis.get('stats');
    if (stats) {
        let res = JSON.parse(stats);
        return {
            lastRatingDate: new Date(res.lastRatingDate),
            lastNoteDate: new Date(res.lastNoteDate),
            countNotes: res.countNotes,
            countRatings: res.countRatings,
            countUsers: res.countUsers
        }
    } else {
        return {
            lastRatingDate: new Date(),
            lastNoteDate: new Date(),
            countNotes: 0,
            countRatings: 0,
            countUsers: 0
        };
    }
}

const formatNumber = (num: number): string => {
    // if over a million, return X.YYM
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
    } else {
        return num.toLocaleString();
    }
}


export { getStatsFromRedis, formatNumber };
