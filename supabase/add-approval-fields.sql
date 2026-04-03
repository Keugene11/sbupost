-- Add approval fields for post and message moderation
-- Posts and messages default to unapproved; only admin-approved content is visible to others
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Approve all existing content
UPDATE posts SET is_approved = TRUE WHERE is_approved = FALSE;
UPDATE messages SET is_approved = TRUE WHERE is_approved = FALSE;
