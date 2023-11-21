'use server';
import { lastRatingDate } from './db';

const rateLimiter = (func: () => any, limitInSeconds: number) => {
    let lastRan: number | null = null;
    let lastResult: any;

    const limit = limitInSeconds * 1000; // Convert seconds to milliseconds

    return function () {
        const now = Date.now();

        if (!lastRan || (now - lastRan) >= limit) {
            lastRan = now;
            lastResult = func();
        } else {
        }

        return lastResult;
    }
}

const lastRatingDateLimited = rateLimiter(lastRatingDate, 300); // 5 mins caching

export { lastRatingDateLimited };
