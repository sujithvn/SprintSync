import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import { testDb } from './testDb';
import { users } from '../../models/schema';

export interface TestUser {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
  token: string;
}

export const createTestUser = async (
  username: string = 'testuser',
  password: string = 'testpass123',
  isAdmin: boolean = false
): Promise<TestUser> => {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const [user] = await testDb.insert(users).values({
    username,
    password: hashedPassword,
    isAdmin,
  }).returning();

  if (!user) {
    throw new Error('Failed to create test user');
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });

  return {
    id: user.id,
    username: user.username,
    password, // Return original password for testing
    isAdmin: user.isAdmin,
    token,
  };
};

export const createTestAdmin = async (): Promise<TestUser> => {
  return createTestUser('testadmin', 'adminpass123', true);
};

export const getAuthHeader = (token: string): { Authorization: string } => {
  return { Authorization: `Bearer ${token}` };
};
