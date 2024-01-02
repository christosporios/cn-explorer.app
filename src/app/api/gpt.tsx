"use server";
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY || "" });

const dbDescription = `
        CREATE TABLE ratings (
            note_id BIGINT, -- The ID of the note (a string of digits)
            rating_participant_id TEXT, -- The participant ID of the user who wrote this note (a string of 64 hex characters)
            created_at_millis BIGINT, -- The time that this note was created
            helpfulness_level TEXT, -- The helpfulness level of this rating. One of HELPFUL, SOMEWHAT_HELPFUL, NOT_HELPFUL
            PRIMARY KEY (note_id, rating_participant_id)
        );

        CREATE MATERIALIZED VIEW notes_with_stats AS
        SELECT 
            n.note_id, -- The ID of the note (a string of digits)
            n.note_author_participant_id, -- The participant ID of the user who wrote this note (a string of 64 hex characters)
            n.created_at_millis, -- The time that this note was created
            n.tweet_id, -- The tweet ID that this note is about (a string of digits)
            n.summary, -- The text of the community note
            n.classification, -- Whether this note is adding context to the tweet, or explaining why it's not needed. One of NOT_MISLEADING or MISINFORMED_OR_POTENTIALLY_MISLEADING
            COUNT(r.note_id) AS ratings_count,
            COUNT(CASE WHEN r.helpfulness_level = 'HELPFUL' THEN 1 END) AS ratings_count_helpful,
            COUNT(CASE WHEN r.helpfulness_level = 'SOMEWHAT_HELPFUL' THEN 1 END) AS ratings_count_somewhat_helpful,
            COUNT(CASE WHEN r.helpfulness_level = 'NOT_HELPFUL' THEN 1 END) AS ratings_count_not_helpful
        FROM 
            notes n
        LEFT JOIN 
            ratings r ON n.note_id = r.note_id
        GROUP BY 
            n.note_id;`;

const maxRows = 50;
const systemPrompt = `
    You are a system that translates natural language queries into SQL queries.
    The database the queries will be ran against is one containing data for Twitter's community notes.
    It looks like this:

    ${dbDescription}

    You should always return up to ${maxRows} rows.
    
    Here are a few examples of queries and your expected response:

    Query: The latest notes
    Response: SELECT * FROM notes_with_stats ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: The latest notes about tweet 1234567890
    Response: SELECT * FROM notes_with_stats WHERE tweet_id = '1234567890' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: The latest notes about tweet 1234567890 that are classifying the tweet as not misleading.
    Response: SELECT * FROM notes_with_stats WHERE tweet_id = '1234567890' AND classification = 'NOT_MISLEADING' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: The latest notes about tweet 1234567890 that are not supportive of the tweet.
    Response: SELECT * FROM notes_with_stats WHERE tweet_id = '1234567890' AND classification = 'MISINFORMED_OR_POTENTIALLY_MISLEADING' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: The latest notes about tweet 1234567890 that are not supportive of the tweet and have at least 20 helpful or somewhat helpful ratings.
    Response: SELECT * FROM notes_with_stats WHERE tweet_id = '1234567890' AND classification = 'MISINFORMED_OR_POTENTIALLY_MISLEADING' AND (ratings_count_helpful + ratings_count_somewhat_helpful) >= 20 ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: The latest ratings
    Response: SELECT * FROM ratings ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Ratings on note 1234567890
    Response: SELECT * FROM ratings WHERE note_id = '1234567890' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Helpful ratings on note 1234567890
    Response: SELECT * FROM ratings WHERE note_id = '1234567890' AND helpfulness_level = 'HELPFUL' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Ratings thar are not unhelpful on note 1234567890
    Response: SELECT * FROM ratings WHERE note_id = '1234567890' AND helpfulness_level != 'NOT_HELPFUL' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Most recent ratings submitted by user ABC123
    Response: SELECT * FROM ratings WHERE rating_participant_id = 'ABC123' ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Ratings on notes containing the word "vaccine"
    Response: SELECT * FROM ratings WHERE note_id IN (SELECT note_id FROM notes WHERE summary LIKE '%vaccine%') ORDER BY created_at_millis DESC LIMIT ${maxRows};

    Query: Users with the most ratings
    Response: SELECT rating_participant_id, COUNT(*) AS ratings_count FROM ratings GROUP BY rating_participant_id ORDER BY ratings_count DESC LIMIT ${maxRows};

    Query: Users with the greatest ratio of unhelpful to total ratings
    Response: SELECT rating_participant_id, COUNT(*) AS ratings_count, COUNT(CASE WHEN helpfulness_level = 'NOT_HELPFUL' THEN 1 END) AS ratings_count_not_helpful, COUNT(CASE WHEN helpfulness_level = 'NOT_HELPFUL' THEN 1 END)::float / COUNT(*) AS ratio FROM ratings GROUP BY rating_participant_id ORDER BY ratio DESC, ratings_count DESC LIMIT 25;

    Respond only with the SQL query, and nothing else. The query must be in a single line, and not annotated as code, even if it is long. Do not start with a code block.
     Output Error: <some vague description> if the query doesn't make sense.
`;

async function gpt({ systemPrompt, userPrompt }: { systemPrompt: string, userPrompt: string }) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        max_tokens: 4096,
        temperature: 0.0,
        messages: [{
            role: "system",
            content: systemPrompt,
        },
        {
            role: "user",
            content: userPrompt
        }]
    });

    const tokens_used = {
        completion_tokens: response.usage?.completion_tokens,
        prompt_tokens: response.usage?.prompt_tokens,
    };
    console.log(tokens_used);

    return response.choices[0].message.content;
}

export async function generateSqlQuery(textQuery : string) : Promise<string> {
    console.log(`Generating sql query for: ${textQuery}`)
    const response = await gpt({
        systemPrompt,
        userPrompt: textQuery
    });
    console.log(`llm response: ${response}`)

    if (response?.startsWith("Error:")) {
        throw new Error(response);
    } else if (response?.startsWith("SELECT")) {
        return response;
    } else {
        throw new Error("Invalid response from OpenAI: " + response);
    }
}