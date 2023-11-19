
import { notesForTweetId } from "../db";

export type QueryResults = {
  type: "notes-list",
  notes: Array<any>
} | {
  type: "error",
  error: string
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

export async function runQuery(query: string) : Promise<QueryResults> {
    query = query.trim();
    const tweetId = extractTweetId(query);

    if (tweetId) {
        return {
            type: "notes-list",
            notes: await notesForTweetId(tweetId)
        }
    } else {
        return {
            type: "error",
            error: "Invalid query"
        }
    }
}