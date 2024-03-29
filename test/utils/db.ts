import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export const connection = postgres(
  'postgres://docker:docker@127.0.0.1:5432/project',
);

export const db = drizzle(connection, { schema });
