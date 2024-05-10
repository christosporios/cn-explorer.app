import fetch from 'node-fetch';
import fs from 'fs';
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import { parse } from 'csv-parse';
import { Client } from 'pg';
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

// Database Client
const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_WRITER_USER,
    password: process.env.DB_WRITER_PASSWORD,
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

type Batch = {
    sqlColumns: string[];
    sqlValues: string[];
    sqlUpdate: string[];
}[];


let formatValue = (value: string, tsvColumn: string) => {
    if (value.endsWith(".0")) {
        return value.slice(0, -2);
    }
    if (tsvColumn = "timestamp_millis_of_current_status") {
        return parseInt(value).toString();
    }
    if (value === "") {
        return null;
    }
    return value;
}

async function processFile(filePath: string, tableName: string, fromDate: Date, toDate: Date, columnMappings: Record<string, string>, keys: string[]) {

    const fileStream = fs.createReadStream(filePath);
    let addedCount = 0;
    const batchSize = 1000;
    const batch = [];

    // Get the total number of lines to process for percentage calculation
    const totalLines = await countLines(filePath);
    let processedLines = 0;
    let startTime = performance.now();

    console.log(`Processing ${filePath} with ${totalLines} lines into table '${tableName}'...`);

    const parser = fileStream.pipe(parse({
        delimiter: '\t',
        columns: true,
        relax_column_count: true
    }));

    for await (const row of parser) {
        processedLines++;
        const createdAt = new Date(parseInt(row.createdAtMillis, 10));
        if (fromDate && toDate && (createdAt < fromDate || createdAt > toDate)) {
            continue;
        }

        const sqlColumns = [];
        const sqlValues = [];
        const sqlUpdate = [];

        for (const [tsvColumn, sqlColumn] of Object.entries(columnMappings)) {
            if (row[tsvColumn] !== undefined) {
                sqlColumns.push(sqlColumn);
                sqlValues.push(formatValue(row[tsvColumn], tsvColumn));
                sqlUpdate.push(`${sqlColumn} = EXCLUDED.${sqlColumn}`);
            }
        }

        batch.push({ sqlColumns, sqlValues, sqlUpdate });

        if (batch.length >= batchSize) {
            addedCount += await executeBatch(batch, tableName, keys);
            batch.length = 0; // clear the batch

            // Calculate and print progress and ETA
            const elapsed = performance.now() - startTime;
            const progress = (processedLines / totalLines) * 100;
            const eta = (elapsed / processedLines) * (totalLines - processedLines) / 1000;

            console.log(`\tProgress: ${progress.toFixed(2)}%, ETA: ${eta.toFixed(2)} seconds`);
        }
    }

    if (batch.length > 0) {
        addedCount += await executeBatch(batch, tableName, keys);

        // Calculate and print final progress and ETA
        const elapsed = performance.now() - startTime;
        const progress = (processedLines / totalLines) * 100;
        const eta = (elapsed / processedLines) * (totalLines - processedLines) / 1000;

        console.log(`\tProgress: ${progress.toFixed(2)}%, ETA: ${eta.toFixed(2)} seconds`);
    }

    return addedCount;
}

async function executeBatch(batch: Batch, tableName: string, keys: string[]) {
    const sqlColumns = batch[0].sqlColumns;
    const sqlUpdate = batch[0].sqlUpdate;


    const valuePlaceholders = batch.map((_, rowIndex) =>
        `(${sqlColumns.map((_, colIndex) => `$${rowIndex * sqlColumns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');

    const query = `
        INSERT INTO ${tableName} (${sqlColumns.join(', ')})
        VALUES ${valuePlaceholders}
        ON CONFLICT (${keys.join(', ')}) DO UPDATE
        SET ${sqlUpdate.join(', ')}
        RETURNING *, (xmax = 0) AS inserted;
        `;

    const values = batch.flatMap(row => row.sqlValues);

    const result = await client.query(query, values);
    return result.rows.filter(row => row.inserted).length;
}

async function countLines(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const parser = fileStream.pipe(parse({
        delimiter: '\t',
        columns: true,
        relax_column_count: true
    }));

    let lineCount = 0;
    for await (const row of parser) {
        lineCount++;
    }

    return lineCount;
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
    trustworthySources: 'trustworthy_sources',
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
    modelingGroup: 'modeling_group',
    numberOfTimesEarnedOut: 'number_of_times_earned_out'
};

const scoredNotesColumnMappings = {
    noteId: 'note_id',
    coreNoteIntercept: 'core_note_intercept',
    coreNoteFactor1: 'core_note_factor1',
    finalRatingStatus: 'final_rating_status',
    firstTag: 'first_tag',
    secondTag: 'second_tag',
    coreActiveRules: 'core_active_rules',
    activeFilterTags: 'active_filter_tags',
    classification: 'classification',
    createdAtMillis: 'created_at_millis',
    coreRatingStatus: 'core_rating_status',
    metaScorerActiveRules: 'meta_scorer_active_rules',
    decidedBy: 'decided_by',
    expansionNoteIntercept: 'expansion_note_intercept',
    expansionNoteFactor1: 'expansion_note_factor1',
    expansionRatingStatus: 'expansion_rating_status',
    coverageNoteIntercept: 'coverage_note_intercept',
    coverageNoteFactor1: 'coverage_note_factor1',
    coverageRatingStatus: 'coverage_rating_status',
    coreNoteInterceptMin: 'core_note_intercept_min',
    coreNoteInterceptMax: 'core_note_intercept_max',
    expansionNoteInterceptMin: 'expansion_note_intercept_min',
    expansionNoteInterceptMax: 'expansion_note_intercept_max',
    coverageNoteInterceptMin: 'coverage_note_intercept_min',
    coverageNoteInterceptMax: 'coverage_note_intercept_max',
    groupNoteIntercept: 'group_note_intercept',
    groupNoteFactor1: 'group_note_factor1',
    groupRatingStatus: 'group_rating_status',
    groupNoteInterceptMax: 'group_note_intercept_max',
    groupNoteInterceptMin: 'group_note_intercept_min',
    modelingGroup: 'modeling_group',
    numRatings: 'num_ratings',
    timestampMillisOfCurrentStatus: 'timestamp_millis_of_current_status',
    expansionPlusNoteIntercept: 'expansion_plus_note_intercept',
    expansionPlusNoteFactor1: 'expansion_plus_note_factor1',
    expansionPlusRatingStatus: 'expansion_plus_rating_status',
    topicNoteIntercept: 'topic_note_intercept',
    topicNoteFactor1: 'topic_note_factor1',
    topicRatingStatus: 'topic_rating_status',
    noteTopic: 'note_topic',
    topicNoteConfident: 'topic_note_confident',
    expansionActiveRules: 'expansion_active_rules',
    expansionPlusActiveRules: 'expansion_plus_active_rules',
    groupActiveRules: 'group_active_rules',
    topicActiveRules: 'topic_active_rules'
};

const helpfulnessScoresColumnMappings = {
    raterParticipantId: 'rater_participant_id',
    coreRaterIntercept: 'core_rater_intercept',
    coreRaterFactor1: 'core_rater_factor1',
    crhCrnhRatioDifference: 'crh_crnh_ratio_difference',
    meanNoteScore: 'mean_note_score',
    raterAgreeRatio: 'rater_agree_ratio',
    successfulRatingHelpfulCount: 'successful_rating_helpful_count',
    successfulRatingNotHelpfulCount: 'successful_rating_not_helpful_count',
    successfulRatingTotal: 'successful_rating_total',
    unsuccessfulRatingHelpfulCount: 'unsuccessful_rating_helpful_count',
    unsuccessfulRatingNotHelpfulCount: 'unsuccessful_rating_not_helpful_count',
    unsuccessfulRatingTotal: 'unsuccessful_rating_total',
    ratingsAwaitingMoreRatings: 'ratings_awaiting_more_ratings',
    ratedAfterDecision: 'rated_after_decision',
    notesCurrentlyRatedHelpful: 'notes_currently_rated_helpful',
    notesCurrentlyRatedNotHelpful: 'notes_currently_rated_not_helpful',
    notesAwaitingMoreRatings: 'notes_awaiting_more_ratings',
    enrollmentState: 'enrollment_state',
    successfulRatingNeededToEarnIn: 'successful_rating_needed_to_earn_in',
    authorTopNotHelpfulTagValues: 'author_top_not_helpful_tag_values',
    timestampOfLastStateChange: 'timestamp_of_last_state_change',
    aboveHelpfulnessThreshold: 'above_helpfulness_threshold',
    isEmergingWriter: 'is_emerging_writer',
    aggregateRatingReceivedTotal: 'aggregate_rating_received_total',
    timestampOfLastEarnOut: 'timestamp_of_last_earn_out',
    groupRaterIntercept: 'group_rater_intercept',
    groupRaterFactor1: 'group_rater_factor1',
    modelingGroup: 'modeling_group',
    raterHelpfulnessReputation: 'rater_helpfulness_reputation',
    numberOfTimesEarnedOut: 'number_of_times_earned_out'
};


const currentDate = new Date();
const formattedDate = format(currentDate, 'yyyy/MM/dd');

const baseUrl = `http://runner.cn-explorer.app/files/`;

const files = [
    /*
    {
        url: baseUrl + 'notes-00000.tsv',
        table: 'notes',
        keys: ['note_id'],
        columnMappings: notesColumnMappings
    },
    {
        url: baseUrl + 'ratings-00000.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00001.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00002.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00003.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00004.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00005.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00006.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'ratings-00007.tsv',
        table: 'ratings',
        keys: ['note_id', 'rating_participant_id'],
        columnMappings: ratingsColumnMappings
    },
    {
        url: baseUrl + 'noteStatusHistory-00000.tsv',
        table: 'note_status',
        keys: ['note_id'],
        columnMappings: noteStatusColumnMappings
    },
    {
        url: baseUrl + 'userEnrollment-00000.tsv',
        table: 'user_enrollment',
        keys: ['participant_id'],
        columnMappings: userEnrollmentColumnMappings
    },*/
    {
        url: baseUrl + 'scored_notes.tsv',
        table: 'scored_notes',
        keys: ['note_id'],
        columnMappings: scoredNotesColumnMappings
    },
    {
        url: baseUrl + 'helpfulness_scores.tsv',
        table: 'helpfulness_scores',
        keys: ['rater_participant_id'],
        columnMappings: helpfulnessScoresColumnMappings

    }
];


async function main() {
    const argv = yargs(hideBin(process.argv))
        .option('from', {
            alias: 'f',
            type: 'string',
            description: 'Start date',
        })
        .option('to', {
            alias: 't',
            type: 'string',
            description: 'End date',
        })
        .option('skipDownload', {
            alias: 's',
            type: 'boolean',
            description: 'Skip downloading files',
            default: false,
        })
        .argv;

    const fromDate = new Date(argv.from);
    const toDate = new Date(argv.to);
    const skipDownload = argv.skipDownload;

    await client.connect();

    try {
        const outputs = new Map();
        if (!skipDownload) {
            for (const file of files) {
                console.log(`Downloading ${file.url}...`);
                const outputPath = './tmp/' + file.url.split('/').pop();
                await downloadFile(file.url, outputPath);
                const fileSize = fs.statSync(outputPath).size;
                const humanReadableFileSize = (fileSize / 1024 / 1024).toFixed(2);
                console.log(`Downloaded ${humanReadableFileSize}MB to ${outputPath}`);
                outputs.set(file.url, outputPath);
            }
        }

        for (const file of files) {
            const outputPath = skipDownload ? './tmp/' + file.url.split('/').pop() : outputs.get(file.url);
            const addedCount = await processFile(outputPath, file.table, fromDate, toDate, file.columnMappings, file.keys);
            console.log(`Added ${addedCount} new rows to ${file.table}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
