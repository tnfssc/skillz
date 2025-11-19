import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const skills = sqliteTable('skills', {
    id: integer('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    author: text('author').notNull(),
    authorId: integer('author_id').notNull().references(() => users.id),
    repository: text('repository'),
    homepage: text('homepage'),
    license: text('license'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const versions = sqliteTable('versions', {
    id: integer('id').primaryKey(),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    version: text('version').notNull(),
    description: text('description'),
    tarballUrl: text('tarball_url').notNull(),
    integrity: text('integrity'),
    manifest: text('manifest', { mode: 'json' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const downloads = sqliteTable('downloads', {
    id: integer('id').primaryKey(),
    versionId: integer('version_id').notNull().references(() => versions.id),
    count: integer('count').notNull().default(0),
    date: text('date').notNull(), // YYYY-MM-DD
});

export const tags = sqliteTable('tags', {
    id: integer('id').primaryKey(),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    tag: text('tag').notNull(),
});

export const ratings = sqliteTable('ratings', {
    id: integer('id').primaryKey(),
    skillId: integer('skill_id').notNull().references(() => skills.id),
    userId: integer('user_id').notNull().references(() => users.id),
    rating: integer('rating').notNull(), // 1-5
    review: text('review'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
