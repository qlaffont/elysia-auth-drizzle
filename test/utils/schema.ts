import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Users
 */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => {
        return new Date();
      }),
  },
  (users) => ({
    idIdx: index('user_id_idx').on(users.id),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  tokens: many(tokens),
}));

/**
 * Tokens
 */

export const tokens = pgTable(
  'tokens',
  {
    id: uuid('id').notNull().defaultRandom(),

    ownerId: uuid('owner_id').notNull(),

    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (tokens) => ({
    idIdx: index('tokens_id_idx').on(tokens.id),
  }),
);

export const tokensRelations = relations(tokens, ({ one }) => ({
  owner: one(users, {
    fields: [tokens.ownerId],
    references: [users.id],
  }),
}));
