-- Migration: Normalize tags schema
-- This migration refactors the tags table to use a proper many-to-many relationship
-- with a junction table for better performance and data integrity.

-- Create new normalized tags table
CREATE TABLE tags_new (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX tag_slug_index ON tags_new(slug);

-- Create junction table for many-to-many relationship
CREATE TABLE skill_tags (
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags_new(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX skill_tags_pk ON skill_tags(skill_id, tag_id);
CREATE INDEX skill_tags_skill_idx ON skill_tags(skill_id);
CREATE INDEX skill_tags_tag_idx ON skill_tags(tag_id);

-- Migrate existing data: Extract unique tags
INSERT INTO tags_new (name, slug, created_at)
SELECT DISTINCT tag, tag, unixepoch() * 1000
FROM tags
WHERE tag IS NOT NULL AND tag != '';

-- Migrate relationships: Link skills to their tags
INSERT INTO skill_tags (skill_id, tag_id)
SELECT t.skill_id, tn.id
FROM tags t
INNER JOIN tags_new tn ON t.tag = tn.slug
WHERE t.tag IS NOT NULL AND t.tag != '';

-- Drop old table
DROP TABLE tags;

-- Rename new table to final name
ALTER TABLE tags_new RENAME TO tags;
