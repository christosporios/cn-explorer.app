'use server';
import { memoize } from 'lodash';
import { lastRatingDate } from './db';

export const lastRatingDateMem = memoize(lastRatingDate);