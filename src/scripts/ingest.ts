import fetch from 'node-fetch';
import fs from 'fs';
import { parse } from 'csv-parse';
import { Client } from 'pg';
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

// Database Client
const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

async function downloadFile(url: string, outputPath: string) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
        response.body!.pipe(fileStream);
        response.body!.on('error', reject);
        fileStream.on('finish', resolve);
    });
}

async function processFile(filePath: string, tableName: string, fromDate: Date, toDate: Date, columnMappings: Record<string, string>, keys: string[]) {
    console.log(`Processing ${filePath} into table '${tableName}'...`);

    const fileStream = fs.createReadStream(filePath);
    let addedCount = 0;

    const parser = fileStream.pipe(parse({
        delimiter: '\t',
        columns: true,
        relax_column_count: true
    }));

    for await (const row of parser) {
        const createdAt = new Date(parseInt(row.createdAtMillis, 10));
        if (createdAt < fromDate || createdAt > toDate) {
            continue;
        }

        const sqlColumns = [];
        const sqlValues = [];
        const sqlUpdate = [];

        for (const [tsvColumn, sqlColumn] of Object.entries(columnMappings)) {
            if (row[tsvColumn] !== undefined) {
                sqlColumns.push(sqlColumn);
                sqlValues.push(row[tsvColumn]);
                sqlUpdate.push(`${sqlColumn} = EXCLUDED.${sqlColumn}`);
            }
        }

        const query = `
        INSERT INTO ${tableName} (${sqlColumns.join(', ')})
        VALUES (${sqlValues.map((_, index) => `$${index + 1}`).join(', ')})
        ON CONFLICT (${keys.join(', ')}) DO UPDATE
        SET ${sqlUpdate.join(', ')}
        RETURNING *, (xmax = 0) AS inserted;
        `;

        const result = await client.query(query, sqlValues);
        addedCount += result.rows[0].inserted ? 1 : 0;
    }

    return addedCount;
}

const notesColumnMappings = {
    noteId: 'note_id',
    noteAuthorParticipantId: 'note_author_participant_id',
    createdAtMillis: 'created_at_millis',
    tweetId: 'tweet_id',
    classification: 'classification',
    // ... skipping deprecated columns like 'believable', 'harmful', etc.
    misleadingOther: 'misleading_other',
    misleadingFactualError: 'misleading_factual_error',
    misleadingManipulatedMedia: 'misleading_manipulated_media',
    misleadingOutdatedInformation: 'misleading_outdated_information',
    misleadingMissingImportantContext: 'misleading_missing_important_context',
    misleadingUnverifiedClaimAsFact: 'misleading_unverified_claim_as_fact',
    misleadingSatire: 'misleading_satire',
    notMisleadingOther: 'not_misleading_other',
    notMisleadingFactuallyCorrect: 'not_misleading_factually_correct',
    notMisleadingOutdatedButNotWhenWritten: 'not_misleading_outdated_but_not_when_written',
    notMisleadingClearlySatire: 'not_misleading_clearly_satire',
    notMisleadingPersonalOpinion: 'not_misleading_personal_opinion',
    trustowrthySource: 'trustworthy_sources',
    summary: 'summary',
    isMediaNote: 'is_media_note',
};

const ratingsColumnMappings = {
    noteId: 'note_id',
    raterParticipantId: 'rating_participant_id',
    createdAtMillis: 'created_at_millis',
    version: 'version',
    agree: 'agree',
    disagree: 'disagree',
    // ... skipping deprecated columns
    helpfulnessLevel: 'helpfulness_level',
    helpfulOther: 'helpful_other',
    helpfulClear: 'helpful_clear',
    helpfulGoodSources: 'helpful_good_sources',
    helpfulAddressesClaim: 'helpful_addresses_claim',
    helpfulImportantContext: 'helpful_important_context',
    helpfulUnbiasedLanguage: 'helpful_unbiased_language',
    notHelpfulOther: 'not_helpful_other',
    notHelpfulIncorrect: 'not_helpful_incorrect',
    notHelpfulSourcesMissingOrUnreliable: 'not_helpful_sources_missing_or_unreliable',
    notHelpfulMissingKeyPoints: 'not_helpful_missing_key_points',
    notHelpfulHardToUnderstand: 'not_helpful_hard_to_understand',
    notHelpfulArgumentativeOrBiased: 'not_helpful_argumentative_or_biased',
    notHelpfulSpamHarassmentOrAbuse: 'not_helpful_spam_harassment_or_abuse',
    notHelpfulIrrelevantSources: 'not_helpful_irrelevant_sources',
    notHelpfulNoteNotNeeded: 'not_helpful_note_not_needed',
    ratedOnTweetId: 'rated_on_tweet_id'
};

const noteStatusColumnMappings = {
    noteId: 'note_id',
    noteAuthorParticipantId: 'note_author_participant_id',
    createdAtMillis: 'created_at_millis',
    timestampMillisOfFirstNonNMRStatus: 'timestamp_millis_of_first_non_nmr_status',
    firstNonNMRStatus: 'first_non_nmr_status',
    timestampMillisOfCurrentStatus: 'timestamp_millis_of_current_status',
    currentStatus: 'current_status',
    timestampMillisOfLatestNonNMRStatus: 'timestamp_millis_of_latest_non_nmr_status',
    mostRecentNonNMRStatus: 'most_recent_non_nmr_status',
    timestampMillisOfStatusLock: 'timestamp_millis_of_status_lock',
    lockedStatus: 'locked_status',
    timestampMillisOfRetroLock: 'timestamp_millis_of_retro_lock',
    currentCoreStatus: 'current_core_status',
    currentExpansionStatus: 'current_expansion_status',
    currentGroupStatus: 'current_group_status',
    currentDecidedBy: 'current_decided_by',
    currentModelingGroup: 'current_modeling_group'
};

const userEnrollmentColumnMappings = {
    participantId: 'participant_id',
    enrollmentState: 'enrollment_state',
    successfulRatingNeededToEarnIn: 'successful_rating_needed_to_earn_in',
    timestampOfLastStateChange: 'timestamp_of_last_state_change',
    timestampOfLastEarnOut: 'timestamp_of_last_earn_out',
    modelingPopulation: 'modeling_population',
    modelingGroup: 'modeling_group'
};

const currentDate = new Date();
const formattedDate = format(currentDate, 'yyyy/MM/dd');

const baseUrl = `https://ton.twimg.com/birdwatch-public-data/${formattedDate}/`;

const files = [
    {
        url: baseUrl + 'notes/notes-00000.tsv',
        table: 'notes',
        keys: ['note_id'],
        columnMappings: notesColumnMappings
    },
    {
        url: baseUrl + 'noteRatings/ratings-00000.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'noteRatings/ratings-00001.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'noteRatings/ratings-00002.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'noteRatings/ratings-00003.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'noteStatusHistory/noteStatusHistory-00000.tsv',
        table: 'note_status',
        keys: ['note_id'],
        columnMappings: noteStatusColumnMappings
    },
    {
        url: baseUrl + 'userEnrollment/userEnrollment-00000.tsv',
        table: 'user_enrollment',
        keys: ['participant_id'],
        columnMappings: userEnrollmentColumnMappings
    }
];

async function main() {
    await client.connect();

    const fromDate = new Date(process.argv[2]);
    const toDate = new Date(process.argv[3]);

    try {
        for (const file of files) {
            console.log(`Downloading ${file.url}...`)
            const outputPath = './tmp/' + file.url.split('/').pop();
            await downloadFile(file.url, outputPath);
            const addedCount = await processFile(outputPath, file.table, fromDate, toDate, file.columnMappings, file.keys);
            console.log(`Added ${addedCount} new rows to ${file.table}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

main();