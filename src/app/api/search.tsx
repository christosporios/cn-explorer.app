
"use server";
import { get } from "lodash";
import { notesForTweetId, queryDatabase } from "../db";
import { generateSqlQuery } from "./gpt";
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export type QueryResults = {
  type: "notes-list",
  tweetId?: string,
  notes: Array<any>
} | {
  type: "ratings",
  ratings: Array<any>
} | {
  type: "error",
  error: string
} | {
  type: "user",
  userId: string
} | {
  type: "table",
  results: Array<any>
};

export type QueryStatus = {
  status: "created" | "generating-sql" | "executing" | "done" | "error",
  query?: string,
  error?: string,
  sqlQuery?: string,
  results?: QueryResults
  times?: {
    generation: number,
    execution: number
  }
}

function extractTweetId(query: string): string | null {
  const standaloneIdRegex = /^\d+$/;
  const urlIdRegex = /^(?:https?:\/\/)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)$/;
  const tweetPrefixRegex = /^tweet (\d+)$/i;

  if (standaloneIdRegex.test(query)) {
    return query;
  } else if (urlIdRegex.test(query)) {
    const match = query.match(urlIdRegex);
    return match ? match[1] : null;
  } else if (tweetPrefixRegex.test(query)) {
    const match = query.match(tweetPrefixRegex);
    return match ? match[1] : null;
  }

  return null;
}

async function smartQuery(query: string): Promise<QueryResults> {
  try {

    var sqlQuery = await generateSqlQuery(query);
    console.log(`Generated SQL query: ${sqlQuery}`)
  } catch (e) {
    console.log(e);
    return {
      type: "error",
      error: "Could not parse query"
    }
  }

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

let doneStatusWithExecutionTime = async (query: string, func: () => Promise<QueryResults>): Promise<QueryStatus> => {
  let start = Date.now();
  try {
    var results = await func();
  } catch (e) {
    console.log("Error executing query")
    console.log(e);
    return {
      status: "error",
      query,
      error: "Could not execute query"
    }
  }
  let end = Date.now();
  return {
    status: "done",
    query: query,
    results,
    times: {
      generation: 0,
      execution: end - start
    }
  }
}

let getCreatedStatus = async (query: string): Promise<QueryStatus> => {
  let status: QueryStatus = {
    status: "created",
    query
  };

  return status;
}

let getInitialStatusForQuery = async (query: string): Promise<QueryStatus> => {
  query = query.trim();
  const tweetId = extractTweetId(query);

  if (tweetId) {
    return doneStatusWithExecutionTime(query, async () => {
      return {
        type: "notes-list",
        tweetId,
        notes: await notesForTweetId(tweetId)
      }
    });
  } else if (query.length == 64 && /^[0-9A-F]+$/.test(query)) {
    return doneStatusWithExecutionTime(query, async () => {
      return {
        type: "user",
        userId: query
      }
    });
  } else {
    return getCreatedStatus(query);
  }
}

let getFromRedis = async (query: string): Promise<QueryStatus | null> => {
  let value = await redis.get("QUERY:" + query);
  if (value) {
    return JSON.parse(value);
  }
  return null;
}

let saveToRedis = async (query: string, status: QueryStatus) => {
  redis.set("QUERY:" + query, JSON.stringify(status));
}


export async function runQuery(query: string): Promise<QueryStatus> {
  console.log(`Running query: ${query}`);
  let redisValue = await getFromRedis(query);
  if (redisValue) {
    console.log("Got from redis");
    return redisValue;
  }

  console.log("Not in redis");
  let status = await getInitialStatusForQuery(query);
  saveToRedis(query, status);
  return status;
}