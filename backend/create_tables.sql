-- This script creates the search_history table if it doesn't exist

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);

-- If you want to add the keywords column later, you can use:
-- ALTER TABLE search_history ADD COLUMN IF NOT EXISTS keywords TEXT;

-- Sample command to see table structure:
-- \d search_history 