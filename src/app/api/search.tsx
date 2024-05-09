
import { notesForTweetId, queryDatabase } from "../db";
import { generateSqlQuery } from "./gpt";

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

export async function runQuery(query: string): Promise<QueryResults> {
  query = query.trim();
  const tweetId = extractTweetId(query);

  if (tweetId) {
    return {
      type: "notes-list",
      tweetId,
      notes: await notesForTweetId(tweetId)
    }
  } else if (query.length == 64 && /^[0-9A-F]+$/.test(query)) {
    return {
      type: "user",
      userId: query
    }
  } else {
    return smartQuery(query);
  }
}