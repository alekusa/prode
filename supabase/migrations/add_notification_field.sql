-- Add notification_sent_at column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of pending notifications
CREATE INDEX IF NOT EXISTS idx_matches_notification_pending 
ON matches(status, start_time, notification_sent_at) 
WHERE status = 'finished' AND notification_sent_at IS NULL;
