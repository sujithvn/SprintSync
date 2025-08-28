import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './models/schema.js';

// Create the database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync';

// Create postgres client
const client = postgres(connectionString);

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export the client for cleanup if needed
export { client };
