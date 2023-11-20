-- Notes Table
CREATE TABLE notes (
    note_id BIGINT PRIMARY KEY,
    note_author_participant_id TEXT,
    created_at_millis BIGINT,
    tweet_id BIGINT,
    classification TEXT,
    misleading_other BOOLEAN,
    misleading_factual_error BOOLEAN,
    misleading_manipulated_media BOOLEAN,
    misleading_outdated_information BOOLEAN,
    misleading_missing_important_context BOOLEAN,
    misleading_unverified_claim_as_fact BOOLEAN,
    misleading_satire BOOLEAN,
    not_misleading_other BOOLEAN,
    not_misleading_factually_correct BOOLEAN,
    not_misleading_outdated_but_not_when_written BOOLEAN,
    not_misleading_clearly_satire BOOLEAN,
    not_misleading_personal_opinion BOOLEAN,
    trustworthy_sources TEXT,
    summary TEXT,
    is_media_note BOOLEAN
);

-- Note Status Table
CREATE TABLE note_status (
    note_id BIGINT PRIMARY KEY,
    note_author_participant_id TEXT,
    created_at_millis BIGINT,
    timestamp_millis_of_first_non_nmr_status BIGINT,
    first_non_nmr_status TEXT,
    timestamp_millis_of_current_status BIGINT,
    current_status TEXT,
    timestamp_millis_of_latest_non_nmr_status BIGINT,
    most_recent_non_nmr_status TEXT,
    timestamp_millis_of_status_lock BIGINT,
    locked_status TEXT,
    timestamp_millis_of_retro_lock BIGINT,
    current_core_status TEXT,
    current_expansion_status TEXT,
    current_group_status TEXT,
    current_decided_by TEXT,
    current_modeling_group TEXT
);

-- User Enrollment Table
CREATE TABLE user_enrollment (
    participant_id TEXT PRIMARY KEY,
    enrollment_state TEXT,
    successful_rating_needed_to_earn_in INTEGER,
    timestamp_of_last_state_change BIGINT,
    timestamp_of_last_earn_out BIGINT,
    modeling_population TEXT,
    modeling_group TEXT
);

CREATE TABLE ratings (
    note_id BIGINT,
    rating_participant_id TEXT,
    created_at_millis BIGINT,
    version INTEGER,
    agree INTEGER,
    disagree INTEGER,
    helpfulness_level TEXT,
    helpful_other INTEGER,
    helpful_clear INTEGER,
    helpful_good_sources INTEGER,
    helpful_addresses_claim INTEGER,
    helpful_important_context INTEGER,
    helpful_unbiased_language INTEGER,
    not_helpful_other INTEGER,
    not_helpful_incorrect INTEGER,
    not_helpful_sources_missing_or_unreliable INTEGER,
    not_helpful_missing_key_points INTEGER,
    not_helpful_hard_to_understand INTEGER,
    not_helpful_argumentative_or_biased INTEGER,
    not_helpful_spam_harassment_or_abuse INTEGER,
    not_helpful_irrelevant_sources INTEGER,
    not_helpful_note_not_needed INTEGER,
    rated_on_tweet_id BIGINT,
    PRIMARY KEY (note_id, rating_participant_id)
);

DROP MATERIALIZED VIEW IF EXISTS notes_with_stats;

CREATE MATERIALIZED VIEW notes_with_stats AS
SELECT 
    n.note_id,
    n.note_author_participant_id,
    n.created_at_millis,
    n.tweet_id,
    n.summary,
    n.classification,
    COUNT(r.note_id) AS ratings_count,
    COUNT(CASE WHEN r.helpfulness_level = 'HELPFUL' THEN 1 END) AS ratings_count_helpful,
    COUNT(CASE WHEN r.helpfulness_level = 'SOMEWHAT_HELPFUL' THEN 1 END) AS ratings_count_somewhat_helpful,
    COUNT(CASE WHEN r.helpfulness_level = 'NOT_HELPFUL' THEN 1 END) AS ratings_count_not_helpful
FROM 
    notes n
LEFT JOIN 
    ratings r ON n.note_id = r.note_id
GROUP BY 
    n.note_id;
