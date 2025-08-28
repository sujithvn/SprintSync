import request from 'supertest';
import app from '../../server';
import { setupTestDatabase, cleanupTestDatabase, clearTestData } from '../setup/testDb';
import { createTestUser, createTestAdmin, getAuthHeader } from '../setup/testAuth';

describe('Users Routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const admin = await createTestAdmin();
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      const res = await request(app)
        .get('/api/users')
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body.some((u: any) => u.username === admin.username)).toBe(true);
      expect(res.body.some((u: any) => u.username === user1.username)).toBe(true);
      expect(res.body.some((u: any) => u.username === user2.username)).toBe(true);
      
      // Ensure no passwords are returned
      res.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should return 403 for non-admin users', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get('/api/users')
        .set(getAuthHeader(user.token))
        .expect(403);

      expect(res.body.error).toBe('Admin access required');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(401);

      expect(res.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user profile for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser('targetuser', 'pass123');

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(res.body.id).toBe(user.id);
      expect(res.body.username).toBe(user.username);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return own profile for regular user', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set(getAuthHeader(user.token))
        .expect(200);

      expect(res.body.id).toBe(user.id);
      expect(res.body.username).toBe(user.username);
    });

    it('should return 403 when user tries to access another user profile', async () => {
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      const res = await request(app)
        .get(`/api/users/${user2.id}`)
        .set(getAuthHeader(user1.token))
        .expect(403);

      expect(res.body.error).toBe('Access denied');
    });

    it('should return 404 when user does not exist', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .get('/api/users/999')
        .set(getAuthHeader(admin.token))
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 for invalid user ID', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .get('/api/users/invalid')
        .set(getAuthHeader(admin.token))
        .expect(400);

      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser('oldname', 'pass123');

      const updateData = {
        username: 'newname',
        isAdmin: true,
      };

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getAuthHeader(admin.token))
        .send(updateData)
        .expect(200);

      expect(res.body.username).toBe('newname');
      expect(res.body.isAdmin).toBe(true);
    });

    it('should return 403 for non-admin users', async () => {
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      const updateData = { username: 'newname' };

      const res = await request(app)
        .put(`/api/users/${user2.id}`)
        .set(getAuthHeader(user1.token))
        .send(updateData)
        .expect(403);

      expect(res.body.error).toBe('Admin access required');
    });

    it('should return 404 when user does not exist', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .put('/api/users/999')
        .set(getAuthHeader(admin.token))
        .send({ username: 'newname' })
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });

    it('should return 400 when no fields to update', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      const res = await request(app)
        .put(`/api/users/${user.id}`)
        .set(getAuthHeader(admin.token))
        .send({})
        .expect(400);

      expect(res.body.error).toBe('No fields to update');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      const res = await request(app)
        .delete(`/api/users/${user.id}`)
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(res.body.message).toBe('User deleted successfully');
      expect(res.body.user.id).toBe(user.id);
    });

    it('should return 403 for non-admin users', async () => {
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      const res = await request(app)
        .delete(`/api/users/${user2.id}`)
        .set(getAuthHeader(user1.token))
        .expect(403);

      expect(res.body.error).toBe('Admin access required');
    });

    it('should return 404 when user does not exist', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .delete('/api/users/999')
        .set(getAuthHeader(admin.token))
        .expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  describe('GET /api/users/:id/tasks', () => {
    it('should return user tasks for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      // Create a task for the user (we'll need to import testDb and tasks schema)
      // For now, this test will verify the endpoint structure
      const res = await request(app)
        .get(`/api/users/${user.id}/tasks`)
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return own tasks for regular user', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .get(`/api/users/${user.id}/tasks`)
        .set(getAuthHeader(user.token))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 when user tries to access another user tasks', async () => {
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      const res = await request(app)
        .get(`/api/users/${user2.id}/tasks`)
        .set(getAuthHeader(user1.token))
        .expect(403);

      expect(res.body.error).toBe('Access denied');
    });
  });
});
