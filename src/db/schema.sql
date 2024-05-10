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

ALTER TABLE user_enrollment ADD COLUMN number_of_times_earned_out INTEGER;

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

-- Scored Notes Table
CREATE TABLE scored_notes (
    note_id TEXT PRIMARY KEY,
    core_note_intercept REAL,
    core_note_factor1 REAL,
    final_rating_status TEXT,
    first_tag TEXT,
    second_tag TEXT,
    core_active_rules TEXT,
    active_filter_tags TEXT,
    classification TEXT,
    created_at_millis BIGINT,
    core_rating_status TEXT,
    meta_scorer_active_rules TEXT,
    decided_by TEXT,
    expansion_note_intercept REAL,
    expansion_note_factor1 REAL,
    expansion_rating_status TEXT,
    coverage_note_intercept REAL,
    coverage_note_factor1 REAL,
    coverage_rating_status TEXT,
    core_note_intercept_min REAL,
    core_note_intercept_max REAL,
    expansion_note_intercept_min REAL,
    expansion_note_intercept_max REAL,
    coverage_note_intercept_min REAL,
    coverage_note_intercept_max REAL,
    group_note_intercept REAL,
    group_note_factor1 REAL,
    group_rating_status TEXT,
    group_note_intercept_max REAL,
    group_note_intercept_min REAL,
    modeling_group TEXT,
    num_ratings INTEGER,
    timestamp_millis_of_current_status BIGINT,
    expansion_plus_note_intercept REAL,
    expansion_plus_note_factor1 REAL,
    expansion_plus_rating_status TEXT,
    topic_note_intercept REAL,
    topic_note_factor1 REAL,
    topic_rating_status TEXT,
    note_topic TEXT,
    topic_note_confident BOOLEAN,
    expansion_active_rules TEXT,
    expansion_plus_active_rules TEXT,
    group_active_rules TEXT,
    topic_active_rules TEXT
);

-- Helpfulness Scores Table
CREATE TABLE helpfulness_scores (
    rater_participant_id TEXT PRIMARY KEY,
    core_rater_intercept REAL,
    core_rater_factor1 REAL,
    crh_crnh_ratio_difference REAL,
    mean_note_score REAL,
    rater_agree_ratio REAL,
    successful_rating_helpful_count REAL,
    successful_rating_not_helpful_count REAL,
    successful_rating_total REAL,
    unsuccessful_rating_helpful_count REAL,
    unsuccessful_rating_not_helpful_count REAL,
    unsuccessful_rating_total REAL,
    ratings_awaiting_more_ratings REAL,
    rated_after_decision REAL,
    notes_currently_rated_helpful REAL,
    notes_currently_rated_not_helpful REAL,
    notes_awaiting_more_ratings REAL,
    enrollment_state TEXT,
    successful_rating_needed_to_earn_in REAL,
    author_top_not_helpful_tag_values TEXT,
    timestamp_of_last_state_change BIGINT,
    above_helpfulness_threshold BOOLEAN,
    is_emerging_writer BOOLEAN,
    aggregate_rating_received_total REAL,
    timestamp_of_last_earn_out BIGINT,
    group_rater_intercept REAL,
    group_rater_factor1 REAL,
    modeling_group TEXT,
    rater_helpfulness_reputation REAL,
    number_of_times_earned_out REAL
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
    sn.final_rating_status AS final_rating_status,
    sn.core_rating_status AS core_rating_status,
    sn.expansion_rating_status AS expansion_rating_status,
    sn.coverage_rating_status AS coverage_rating_status,
    sn.group_rating_status AS group_rating_status,
    sn.expansion_plus_rating_status AS expansion_plus_rating_status,
    sn.topic_rating_status AS topic_rating_status,
    sn.note_topic AS note_topic,
    sn.topic_note_confident AS topic_note_confident,
    sn.num_ratings AS scored_num_ratings,
    sn.modeling_group AS modeling_group,
    sn.created_at_millis AS scored_created_at_millis,
    sn.decided_by AS decided_by,
    sn.first_tag AS first_tag,
    sn.second_tag AS second_tag,
    COUNT(r.note_id) AS ratings_count,
    COUNT(CASE WHEN r.helpfulness_level = 'HELPFUL' THEN 1 END) AS ratings_count_helpful,
    COUNT(CASE WHEN r.helpfulness_level = 'SOMEWHAT_HELPFUL' THEN 1 END) AS ratings_count_somewhat_helpful,
    COUNT(CASE WHEN r.helpfulness_level = 'NOT_HELPFUL' THEN 1 END) AS ratings_count_not_helpful
FROM 
    notes n
LEFT JOIN
    scored_notes sn ON n.note_id = sn.note_id::bigint
LEFT JOIN 
    ratings r ON n.note_id = r.note_id
GROUP BY 
    n.note_id, 
    n.note_author_participant_id, 
    n.created_at_millis, 
    n.tweet_id, 
    n.summary, 
    n.classification, 
    sn.final_rating_status, 
    sn.core_rating_status, 
    sn.expansion_rating_status, 
    sn.coverage_rating_status, 
    sn.group_rating_status, 
    sn.expansion_plus_rating_status, 
    sn.topic_rating_status, 
    sn.note_topic, 
    sn.topic_note_confident, 
    sn.num_ratings, 
    sn.modeling_group, 
    sn.created_at_millis, 
    sn.decided_by, 
    sn.first_tag, 
    sn.second_tag;

CREATE INDEX idx_ratings_note_id ON ratings(note_id);
CREATE INDEX idx_notes_with_stats_note_id ON notes_with_stats(note_id);

CREATE INDEX idx_ratings_created_at_millis ON ratings(created_at_millis);
CREATE INDEX idx_notes_with_stats_created_at_millis ON notes_with_stats(created_at_millis);

CREATE INDEX idx_ratings_helpfulness_level ON ratings(helpfulness_level);
CREATE INDEX idx_notes_with_stats_classification ON notes_with_stats(classification);

CREATE INDEX idx_ratings_rating_participant_id ON ratings(rating_participant_id);
CREATE INDEX idx_notes_with_stats_note_author_participant_id ON notes_with_stats(note_author_participant_id);

CREATE INDEX idx_notes_with_stats_tweet_id ON notes_with_stats(tweet_id);
CREATE INDEX idx_notes_with_stats_topic_id ON notes_with_stats(note_topic);
CREATE INDEX idx_notes_with_status_final_rating_status ON notes_with_stats(final_rating_status);
