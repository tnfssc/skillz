-- Seed data for Skillz registry
PRAGMA foreign_keys = OFF;

-- Clean up existing data
DELETE FROM downloads;
DELETE FROM ratings;
DELETE FROM skill_tags;
DELETE FROM tags;
DELETE FROM versions;
DELETE FROM skills;
DELETE FROM user;

-- Seed data for Skillz Registry

-- Users
INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES 
('user_1', 'alice', 'alice@example.com', 1, 1700000000, 1700000000),
('user_2', 'bob', 'bob@example.com', 1, 1700000000, 1700000000);

-- Skills
INSERT INTO skills (id, name, description, author, author_id, repository, homepage, license, created_at, updated_at) VALUES
(1, 'data-analyzer', 'Powerful data analysis and visualization skill for Skillz', 'alice', 'user_1', 'https://github.com/alice/data-analyzer', 'https://skills.example.com/data-analyzer', 'MIT', 1700100000, 1700500000),
(2, 'code-formatter', 'Automated code formatting and linting skill', 'bob', 'user_2', 'https://github.com/bob/code-formatter', NULL, 'Apache-2.0', 1700200000, 1700200000),
(3, 'weather-reporter', 'Real-time weather updates and forecasts', 'alice', 'user_1', 'https://github.com/alice/weather-reporter', NULL, 'ISC', 1700300000, 1700300000),
(4, 'image-generator', 'Generate images from text descriptions using AI', 'alice', 'user_1', 'https://github.com/alice/image-generator', NULL, 'MIT', 1700400000, 1700400000),
(5, 'translator-pro', 'Professional translation skill supporting 50+ languages', 'bob', 'user_2', 'https://github.com/bob/translator-pro', 'https://translator.example.com', 'GPL-3.0', 1700500000, 1700500000);

-- Versions
INSERT INTO versions (id, skill_id, version, description, tarball_url, integrity, manifest, created_at) VALUES
(1, 1, '1.0.0', 'Initial release', 'https://registry.skillz.dev/tarballs/data-analyzer-1.0.0.tgz', 'sha256-hash1', '{"name": "data-analyzer", "version": "1.0.0"}', 1700100000),
(2, 1, '1.1.0', 'Added visualization features', 'https://registry.skillz.dev/tarballs/data-analyzer-1.1.0.tgz', 'sha256-hash2', '{"name": "data-analyzer", "version": "1.1.0"}', 1700150000),
(3, 1, '2.0.0', 'Major update with new engine', 'https://registry.skillz.dev/tarballs/data-analyzer-2.0.0.tgz', 'sha256-hash3', '{"name": "data-analyzer", "version": "2.0.0"}', 1700500000),
(4, 2, '0.1.0', 'Beta release', 'https://registry.skillz.dev/tarballs/code-formatter-0.1.0.tgz', 'sha256-hash4', '{"name": "code-formatter", "version": "0.1.0"}', 1700200000),
(5, 3, '1.0.0', 'First stable release', 'https://registry.skillz.dev/tarballs/weather-reporter-1.0.0.tgz', 'sha256-hash5', '{"name": "weather-reporter", "version": "1.0.0"}', 1700300000),
(6, 3, '1.0.1', 'Bug fixes', 'https://registry.skillz.dev/tarballs/weather-reporter-1.0.1.tgz', 'sha256-hash6', '{"name": "weather-reporter", "version": "1.0.1"}', 1700350000),
(7, 4, '1.0.0', 'Initial release', 'https://registry.skillz.dev/tarballs/image-generator-1.0.0.tgz', 'sha256-hash7', '{"name": "image-generator", "version": "1.0.0"}', 1700400000),
(8, 5, '1.0.0', 'Initial release', 'https://registry.skillz.dev/tarballs/translator-pro-1.0.0.tgz', 'sha256-hash8', '{"name": "translator-pro", "version": "1.0.0"}', 1700500000);

-- Tags
INSERT INTO tags (id, name, slug, created_at) VALUES
(1, 'data', 'data', 1700000000),
(2, 'visualization', 'visualization', 1700000000),
(3, 'analysis', 'analysis', 1700000000),
(4, 'dev-tool', 'dev-tool', 1700000000),
(5, 'formatting', 'formatting', 1700000000),
(6, 'weather', 'weather', 1700000000),
(7, 'news', 'news', 1700000000),
(8, 'ai', 'ai', 1700000000),
(9, 'image', 'image', 1700000000),
(10, 'generation', 'generation', 1700000000),
(11, 'translation', 'translation', 1700000000),
(12, 'language', 'language', 1700000000);

-- Skill Tags
INSERT INTO skill_tags (skill_id, tag_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 4), (2, 5),
(3, 6), (3, 7),
(4, 8), (4, 9), (4, 10),
(5, 11), (5, 12);

-- Ratings
INSERT INTO ratings (id, skill_id, user_id, rating, review, created_at) VALUES
(1, 1, 'user_2', 4, 'Very useful, could use more chart types', 1700300000),
(2, 2, 'user_1', 5, 'Saves so much time on code reviews', 1700400000),
(3, 2, 'user_2', 5, 'Best code review skill I have used', 1700500000),
(4, 3, 'user_2', 4, 'Great for document generation', 1700600000),
(5, 4, 'user_2', 5, 'API testing made easy', 1700700000),
(6, 5, 'user_1', 5, 'Excel automation at its finest', 1700800000);

-- Downloads (sample data for past week)
INSERT INTO downloads (id, version_id, count, date) VALUES
-- data-analyzer (v1.2.0 -> id 3)
(1, 3, 150, '2024-11-11'),
(2, 3, 200, '2024-11-12'),
(3, 3, 180, '2024-11-13'),
(4, 3, 220, '2024-11-14'),
(5, 3, 250, '2024-11-15'),
(6, 3, 300, '2024-11-16'),
(7, 3, 280, '2024-11-17'),

-- code-reviewer (v1.0.1 -> id 5)
(8, 5, 120, '2024-11-11'),
(9, 5, 140, '2024-11-12'),
(10, 5, 160, '2024-11-13'),
(11, 5, 180, '2024-11-14'),
(12, 5, 200, '2024-11-15'),
(13, 5, 220, '2024-11-16'),
(14, 5, 240, '2024-11-17'),

-- document-generator (v1.0.0 -> id 7)
(15, 7, 90, '2024-11-11'),
(16, 7, 100, '2024-11-12'),
(17, 7, 110, '2024-11-13'),
(18, 7, 120, '2024-11-14'),
(19, 7, 130, '2024-11-15'),
(20, 7, 140, '2024-11-16'),
(21, 7, 150, '2024-11-17'),

-- api-tester (v1.0.0 -> id 8)
(22, 8, 80, '2024-11-11'),
(23, 8, 90, '2024-11-12'),
(24, 8, 85, '2024-11-13'),
(25, 8, 95, '2024-11-14'),
(26, 8, 100, '2024-11-15'),
(27, 8, 110, '2024-11-16'),
(28, 8, 120, '2024-11-17');
