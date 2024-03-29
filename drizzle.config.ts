import type { Config } from 'drizzle-kit';

export default {
  schema: './test/utils/schema.ts',
  out: './drizzle',
  driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  dbCredentials: {
    connectionString: 'postgres://docker:docker@127.0.0.1:5432/project',
  },
} satisfies Config;
