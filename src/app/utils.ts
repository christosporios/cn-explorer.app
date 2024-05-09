'use server';
import { lastRatingDate, lastNoteDate, countNotes, countRatings, countUsers } from './db';

function rateLimiter<T>(func: () => T, limitInSeconds: number): () => T {
    let lastRan: number | null = null;
    let lastResult: T | null;

    const limit = limitInSeconds * 1000; // Convert seconds to milliseconds

    return function () {
        const now = Date.now();

        if (!lastRan || !lastResult || (now - lastRan) >= limit) {
            lastRan = now;
            lastResult = func();
        }

        return lastResult;
    }
}

type DBStats = {
    lastRatingDate: Date,
    lastNoteDate: Date,
    countNotes: number,
    countRatings: number,
    countUsers: number
}

const getStats = async (): Promise<DBStats> => {
    return {
        lastRatingDate: await lastRatingDate(),
        lastNoteDate: await lastNoteDate(),
        countNotes: await countNotes(),
        countRatings: await countRatings(),
        countUsers: await countUsers()
    };
}

const formatNumber = (num: number): string => {
    // if over a million, return X.YYM
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
    } else {
        return num.toLocaleString();
    }
}

const getStatsRL = rateLimiter(getStats, 300); // 5 mins caching

export { getStatsRL, formatNumber };
