INSERT INTO users (id, username, email, password_hash, created_at) VALUES
(1, 'alice', 'alice@example.com', '$2a$10$dummy_hash_1', 1700000000);

INSERT INTO skills (id, name, description, author, author_id, repository, homepage, license, created_at, updated_at) VALUES
(1, 'data-analyzer', 'Powerful data analysis and visualization skill for Claude', 'alice', 1, 'https://github.com/alice/data-analyzer', 'https://skills.example.com/data-analyzer', 'MIT', 1700100000, 1700500000);
