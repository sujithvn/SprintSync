import { setupTestDatabase, cleanupTestDatabase } from './testDb';

// Set test database URL before any imports that might use the database
process.env.DATABASE_URL = 'postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync_test';

// Set test JWT secret
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Global setup - runs once before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Global cleanup - runs once after all tests
afterAll(async () => {
  await cleanupTestDatabase();
});

// Increase timeout for async operations
jest.setTimeout(30000);
