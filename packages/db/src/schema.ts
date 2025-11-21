import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "user",
  {
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .$defaultFn(() => false)
      .notNull(),
    id: text("id").primaryKey(),
    image: text("image"),
    name: text("name").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (self) => ({
    userEmailIndex: index("user_email_index").on(self.email),
  }),
);

export const session = sqliteTable(
  "session",
  {
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    id: text("id").primaryKey(),
    ipAddress: text("ip_address"),
    token: text("token").notNull().unique(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (self) => ({
    sessionUserIdIndex: index("session_user_id_index").on(self.userId),
    sessionExpiresAtIndex: index("session_expires_at_index").on(self.expiresAt),
  }),
);

export const account = sqliteTable(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    accountId: text("account_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (self) => ({
    accountUserIdIndex: index("account_user_id_index").on(self.userId),
    accountProviderAccountUniqueIndex: uniqueIndex("account_provider_account_unique_index").on(
      self.providerId,
      self.accountId,
    ),
  }),
);

export const verification = sqliteTable("verification", {
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  value: text("value").notNull(),
});

export const apikey = sqliteTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name"),
    key: text("key").notNull(),
    prefix: text("prefix"),
    start: text("start"),
    enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
    permissions: text("permissions"),
    metadata: text("metadata", { mode: "json" }).$defaultFn(() => ({})),
    rateLimitEnabled: integer("rate_limit_enabled", { mode: "boolean" }).default(true).notNull(),
    rateLimitMax: integer("rate_limit_max").default(10).notNull(),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000).notNull(),
    refillAmount: integer("refill_amount"),
    refillInterval: integer("refill_interval"),
    remaining: integer("remaining"),
    requestCount: integer("request_count").default(0).notNull(),
    lastRefillAt: integer("last_refill_at", { mode: "timestamp" }),
    lastRequest: integer("last_request", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  (self) => ({
    apikeyUserIdIndex: index("apikey_user_id_index").on(self.userId),
    apikeyKeyIndex: uniqueIndex("apikey_key_index").on(self.key),
    apikeyPrefixIndex: uniqueIndex("apikey_prefix_index").on(self.prefix),
  }),
);

export const skills = sqliteTable(
  "skills",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    author: text("author").notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    repository: text("repository"),
    homepage: text("homepage"),
    license: text("license"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    uniqueName: uniqueIndex("unique_name").on(t.name),
  }),
);

export const versions = sqliteTable(
  "versions",
  {
    id: integer("id").primaryKey(),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id),
    version: text("version").notNull(),
    description: text("description"),
    tarballUrl: text("tarball_url").notNull(),
    integrity: text("integrity"),
    manifest: text("manifest", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    uniqueVersion: uniqueIndex("unique_version").on(t.skillId, t.version),
  }),
);

export const downloads = sqliteTable("downloads", {
  id: integer("id").primaryKey(),
  versionId: integer("version_id")
    .notNull()
    .references(() => versions.id),
  count: integer("count").notNull().default(0),
  date: text("date").notNull(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey(),
  skillId: integer("skill_id")
    .notNull()
    .references(() => skills.id),
  tag: text("tag").notNull(),
});

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey(),
  skillId: integer("skill_id")
    .notNull()
    .references(() => skills.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
