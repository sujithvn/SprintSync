import request from 'supertest';
import app from '../../server';
import { clearTestData } from '../setup/testDb';
import { createTestUser } from '../setup/testAuth';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.user.username).toBe(userData.username);
      expect(res.body.user.isAdmin).toBe(false);
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.token).toBeDefined();
    });

    it('should register an admin user when specified', async () => {
      const adminData = {
        username: 'adminuser',
        password: 'adminpass123',
        isAdmin: true,
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      expect(res.body.user.isAdmin).toBe(true);
      expect(res.body.user.username).toBe(adminData.username);
    });

    it('should return 400 when username is missing', async () => {
      const userData = {
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.error).toBe('Username and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const userData = {
        username: 'testuser',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.error).toBe('Username and password are required');
    });

    it('should return 409 when username already exists', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
      };

      // Register user first time
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register same username again
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(res.body.error).toBe('Username already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createTestUser('loginuser', 'loginpass123');
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'loginpass123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.user.username).toBe(loginData.username);
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.token).toBeDefined();
    });

    it('should return 400 when username is missing', async () => {
      const loginData = {
        password: 'loginpass123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(res.body.error).toBe('Username and password are required');
    });

    it('should return 400 when password is missing', async () => {
      const loginData = {
        username: 'loginuser',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(res.body.error).toBe('Username and password are required');
    });

    it('should return 401 when username does not exist', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 when password is incorrect', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token successfully', async () => {
      const testUser = await createTestUser('verifyuser', 'verifypass123');

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(res.body.user.username).toBe('verifyuser');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .expect(401);

      expect(res.body.error).toBe('Access token required');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.error).toBe('Invalid or expired token');
    });

    it('should return 401 when user no longer exists', async () => {
      const testUser = await createTestUser('tempuser', 'temppass123');
      
      // Delete the user but keep the token
      await clearTestData();

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(401);

      expect(res.body.error).toBe('User not found');
    });
  });
});
