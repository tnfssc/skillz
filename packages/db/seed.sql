-- Seed data for Skillz registry
PRAGMA foreign_keys = OFF;

-- Clean up existing data
DELETE FROM downloads;
DELETE FROM ratings;
DELETE FROM tags;
DELETE FROM versions;
DELETE FROM skills;
DELETE FROM users;

-- Users
INSERT INTO users (id, username, email, password_hash, created_at) VALUES
(1, 'alice', 'alice@example.com', '$2a$10$dummy_hash_1', 1700000000),
(2, 'bob', 'bob@example.com', '$2a$10$dummy_hash_2', 1700000100),
(3, 'carol', 'carol@example.com', '$2a$10$dummy_hash_3', 1700000200);

-- Skills
INSERT INTO skills (id, name, description, author, author_id, repository, homepage, license, created_at, updated_at) VALUES
(1, 'data-analyzer', 'Powerful data analysis and visualization skill for Claude', 'alice', 1, 'https://github.com/alice/data-analyzer', 'https://skills.example.com/data-analyzer', 'MIT', 1700100000, 1700500000),
(2, 'code-reviewer', 'Automated code review and quality analysis', 'bob', 2, 'https://github.com/bob/code-reviewer', 'https://skills.example.com/code-reviewer', 'Apache-2.0', 1700200000, 1700600000),
(3, 'document-generator', 'Generate professional documents from templates', 'alice', 1, 'https://github.com/alice/document-generator', 'https://skills.example.com/document-generator', 'MIT', 1700300000, 1700700000),
(4, 'api-tester', 'Test and validate REST APIs with ease', 'carol', 3, 'https://github.com/carol/api-tester', 'https://skills.example.com/api-tester', 'BSD-3', 1700400000, 1700800000),
(5, 'excel-wizard', 'Advanced Excel spreadsheet creation and manipulation', 'bob', 2, 'https://github.com/bob/excel-wizard', 'https://skills.example.com/excel-wizard', 'MIT', 1700450000, 1700850000);

-- Versions
-- Versions
INSERT INTO versions (id, skill_id, version, description, tarball_url, integrity, manifest, created_at) VALUES
(1, 1, '1.0.0', 'Initial release', 'http://localhost:8787/api/v1/tarballs/data-analyzer/data-analyzer-1.0.0.tgz', 'sha256-abc123', '{"name": "data-analyzer", "version": "1.0.0"}', 1700100000),
(2, 1, '1.1.0', 'Added chart support', 'http://localhost:8787/api/v1/tarballs/data-analyzer/data-analyzer-1.1.0.tgz', 'sha256-def456', '{"name": "data-analyzer", "version": "1.1.0"}', 1700300000),
(3, 1, '1.2.0', 'Performance improvements', 'http://localhost:8787/api/v1/tarballs/data-analyzer/data-analyzer-1.2.0.tgz', 'sha256-ghi789', '{"name": "data-analyzer", "version": "1.2.0"}', 1700500000),
(4, 2, '1.0.0', 'First version', 'http://localhost:8787/api/v1/tarballs/code-reviewer/code-reviewer-1.0.0.tgz', 'sha256-jkl012', '{"name": "code-reviewer", "version": "1.0.0"}', 1700200000),
(5, 2, '1.0.1', 'Bug fixes', 'http://localhost:8787/api/v1/tarballs/code-reviewer/code-reviewer-1.0.1.tgz', 'sha256-mno345', '{"name": "code-reviewer", "version": "1.0.1"}', 1700400000),
(6, 3, '0.9.0', 'Beta release', 'http://localhost:8787/api/v1/tarballs/document-generator/document-generator-0.9.0.tgz', 'sha256-pqr678', '{"name": "document-generator", "version": "0.9.0"}', 1700300000),
(7, 3, '1.0.0', 'Official release', 'http://localhost:8787/api/v1/tarballs/document-generator/document-generator-1.0.0.tgz', 'sha256-stu901', '{"name": "document-generator", "version": "1.0.0"}', 1700700000),
(8, 4, '1.0.0', 'Initial release', 'http://localhost:8787/api/v1/tarballs/api-tester/api-tester-1.0.0.tgz', 'sha256-vwx234', '{"name": "api-tester", "version": "1.0.0"}', 1700400000),
(9, 5, '2.0.0', 'Major update', 'http://localhost:8787/api/v1/tarballs/excel-wizard/excel-wizard-2.0.0.tgz', 'sha256-yz1234', '{"name": "excel-wizard", "version": "2.0.0"}', 1700850000);

-- Tags
INSERT INTO tags (id, skill_id, tag) VALUES
(1, 1, 'data'),
(2, 1, 'analytics'),
(3, 1, 'visualization'),
(4, 2, 'code'),
(5, 2, 'review'),
(6, 2, 'quality'),
(7, 3, 'document'),
(8, 3, 'generation'),
(9, 3, 'pdf'),
(10, 4, 'api'),
(11, 4, 'testing'),
(12, 4, 'automation'),
(13, 5, 'excel'),
(14, 5, 'spreadsheet'),
(15, 5, 'data');

-- Ratings
INSERT INTO ratings (id, skill_id, user_id, rating, review, created_at) VALUES
(1, 1, 2, 5, 'Excellent data analysis capabilities!', 1700200000),
(2, 1, 3, 4, 'Very useful, could use more chart types', 1700300000),
(3, 2, 1, 5, 'Saves so much time on code reviews', 1700400000),
(4, 2, 3, 5, 'Best code review skill I have used', 1700500000),
(5, 3, 2, 4, 'Great for document generation', 1700600000),
(6, 4, 1, 5, 'API testing made easy', 1700700000),
(7, 5, 3, 5, 'Excel automation at its finest', 1700800000);

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
(28, 8, 120, '2024-11-17'),

-- excel-wizard (v2.0.0 -> id 9)
(29, 9, 60, '2024-11-11'),
(30, 9, 70, '2024-11-12'),
(31, 9, 75, '2024-11-13'),
(32, 9, 80, '2024-11-14'),
(33, 9, 90, '2024-11-15'),
(34, 9, 100, '2024-11-16'),
(35, 9, 110, '2024-11-17');
