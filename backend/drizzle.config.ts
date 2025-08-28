import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync',
  },
  verbose: true,
  strict: true,
});
