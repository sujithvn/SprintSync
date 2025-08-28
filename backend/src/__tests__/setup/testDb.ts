import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../../models/schema';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync_test';

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export const setupTestDatabase = async () => {
  // Create test database connection
  client = postgres(TEST_DATABASE_URL, {
    max: 1, // Limit connection pool size for tests
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(client, { schema });
  
  // Run migrations for test database
  await migrate(db, { migrationsFolder: './drizzle' });
  
  return { db, client };
};

export const cleanupTestDatabase = async () => {
  try {
    if (client) {
      await client.end();
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
};

export async function clearTestData() {
  try {
    if (!client) {
      throw new Error('Test database not initialized. Call setupTestDatabase first.');
    }
    
    // Use individual DELETE statements to ensure foreign key constraints are handled
    await client`DELETE FROM tasks`;
    await client`DELETE FROM users`;
    
    // Reset sequences
    try {
      await client`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
      await client`ALTER SEQUENCE tasks_id_seq RESTART WITH 1`;
    } catch (e) {
      // Sequences might not exist yet, ignore error
    }
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}

export { db as testDb, client as testClient };
