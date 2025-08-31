import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './models/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let client: postgres.Sql | null = null;

function createDbConnection() {
  // Create the database connection
  const connectionString = process.env.DATABASE_URL || 'postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync';

  // Log database connection info (safely)
  console.log('🗄️  Database connection info:');
  console.log('- DATABASE_URL environment variable exists:', !!process.env.DATABASE_URL);
  console.log('- Connection string length:', connectionString.length);
  console.log('- Using localhost fallback:', connectionString.includes('localhost'));

  // Create postgres client with connection timeout settings
  client = postgres(connectionString, {
    connect_timeout: 30, // 30 seconds
    idle_timeout: 30,
    max_lifetime: 60 * 30, // 30 minutes
    max: 20, // max connections
    ssl: {
      rejectUnauthorized: false, // For RDS, we trust AWS certificates
    },
    onnotice: (notice) => console.log('PostgreSQL notice:', notice),
    debug: process.env.NODE_ENV === 'production' ? false : true,
  });

  // Create drizzle database instance
  dbInstance = drizzle(client, { schema });
  
  return dbInstance;
}

// Lazy-loaded database instance
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    if (!dbInstance) {
      dbInstance = createDbConnection();
    }
    return (dbInstance as any)[prop];
  }
});

// Export the client for cleanup if needed
export { client };
