import request from 'supertest';
import app from '../../server';
import { setupTestDatabase, cleanupTestDatabase, clearTestData } from '../setup/testDb';
import { createTestUser, createTestAdmin, getAuthHeader } from '../setup/testAuth';
import { db } from '../../db';
import { tasks } from '../../models/schema';

describe('Tasks Routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      // Create test tasks
      await db.insert(tasks).values({
        title: 'Admin Task',
        description: 'Task for admin',
        status: 'todo',
        userId: admin.id,
      });

      await db.insert(tasks).values({
        title: 'User Task',
        description: 'Task for user',
        status: 'in_progress',
        userId: user.id,
      });

      const res = await request(app)
        .get('/api/tasks')
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.some((t: any) => t.title === 'Admin Task')).toBe(true);
      expect(res.body.some((t: any) => t.title === 'User Task')).toBe(true);
    });

    it('should return only assigned tasks for regular user', async () => {
      const user1 = await createTestUser('user1', 'pass123');
      const user2 = await createTestUser('user2', 'pass123');

      // Create tasks assigned to different users
      await db.insert(tasks).values({
        title: 'User1 Task',
        description: 'Task for user1',
        status: 'todo',
        userId: user1.id,
      });

      await db.insert(tasks).values({
        title: 'User2 Task',
        description: 'Task for user2',
        status: 'in_progress',
        userId: user2.id,
      });

      const res = await request(app)
        .get('/api/tasks')
        .set(getAuthHeader(user1.token))
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('User1 Task');
      expect(res.body[0].userId).toBe(user1.id);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(res.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      const [task] = await db.insert(tasks).values({
        title: 'Test Task',
        description: 'Task description',
        status: 'todo',
        userId: user.id,
      }).returning();

      const res = await request(app)
        .get(`/api/tasks/${task?.id}`)
        .set(getAuthHeader(admin.token))
        .expect(200);

      expect(res.body.id).toBe(task?.id);
      expect(res.body.title).toBe('Test Task');
    });

    it('should return 404 when task does not exist', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .get('/api/tasks/999')
        .set(getAuthHeader(admin.token))
        .expect(404);

      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create task for admin', async () => {
      const admin = await createTestAdmin();
      const user = await createTestUser();

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        totalMinutes: 120,
        userId: user.id,
      };

      const res = await request(app)
        .post('/api/tasks')
        .set(getAuthHeader(admin.token))
        .send(taskData)
        .expect(201);

      expect(res.body.title).toBe(taskData.title);
      expect(res.body.status).toBe(taskData.status);
      expect(res.body.userId).toBe(taskData.userId);
    });

    it('should return 400 for missing title', async () => {
      const admin = await createTestAdmin();

      const res = await request(app)
        .post('/api/tasks')
        .set(getAuthHeader(admin.token))
        .send({})
        .expect(400);

      expect(res.body.error).toBe('Title is required');
    });
  });
});
