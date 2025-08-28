import request from 'supertest';
import app from '../../server';
import { clearTestData } from '../setup/testDb';

describe('Integration Tests', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  describe('Complete User Workflow', () => {
    it('should allow complete user registration, login, and task management flow', async () => {
      // 1. Register a new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      expect(registerRes.body.user.username).toBe('testuser');
      expect(registerRes.body.user.isAdmin).toBe(false);
      expect(registerRes.body.token).toBeDefined();

      // 2. Login with the registered user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(loginRes.body.token).toBeDefined();
      const userToken = loginRes.body.token;

      // 3. Verify token works
      const verifyRes = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(verifyRes.body.user.username).toBe('testuser');

      // 4. Create a task for the user
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'My First Task',
          description: 'Learning to use the system',
          status: 'todo',
        })
        .expect(201);

      expect(taskRes.body.title).toBe('My First Task');
      expect(taskRes.body.status).toBe('todo');
      const taskId = taskRes.body.id;

      // 5. Get user's tasks
      const tasksRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(tasksRes.body).toHaveLength(1);
      expect(tasksRes.body[0].title).toBe('My First Task');

      // 6. Update task status
      const updateStatusRes = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(updateStatusRes.body.status).toBe('in_progress');

      // 7. Get specific task
      const getTaskRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getTaskRes.body.status).toBe('in_progress');

      // 8. Complete the task
      const completeRes = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'done' })
        .expect(200);

      expect(completeRes.body.status).toBe('done');
    });

    it('should allow admin workflow with user management', async () => {
      // 1. Register admin user
      const adminRegisterRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'admin123',
          isAdmin: true,
        })
        .expect(201);

      expect(adminRegisterRes.body.user.isAdmin).toBe(true);

      // 2. Login as admin
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const adminToken = adminLoginRes.body.token;

      // 3. Register a regular user
      const userRegisterRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'employee',
          password: 'emp123',
        })
        .expect(201);

      const userId = userRegisterRes.body.user.id;

      // 4. Admin gets all users
      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersRes.body).toHaveLength(2);
      expect(usersRes.body.some((u: any) => u.username === 'admin')).toBe(true);
      expect(usersRes.body.some((u: any) => u.username === 'employee')).toBe(true);

      // 5. Admin creates task for employee
      const assignTaskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Assigned Task',
          description: 'Task assigned by admin',
          status: 'todo',
          userId: userId,
        })
        .expect(201);

      expect(assignTaskRes.body.userId).toBe(userId);

      // 6. Admin gets all tasks
      const allTasksRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allTasksRes.body).toHaveLength(1);
      expect(allTasksRes.body[0].title).toBe('Assigned Task');

      // 7. Login as employee and check assigned tasks
      const empLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'employee',
          password: 'emp123',
        })
        .expect(200);

      const empToken = empLoginRes.body.token;

      const empTasksRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${empToken}`)
        .expect(200);

      expect(empTasksRes.body).toHaveLength(1);
      expect(empTasksRes.body[0].title).toBe('Assigned Task');

      // 8. Employee updates task status
      const taskId = empTasksRes.body[0].id;
      await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${empToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // 9. Admin deletes the task
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 10. Verify task is deleted
      const finalTasksRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(finalTasksRes.body).toHaveLength(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication errors gracefully', async () => {
      // Try to access protected route without token
      await request(app)
        .get('/api/tasks')
        .expect(401);

      // Try to access with invalid token (should return 403 for invalid token)
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      // Try to register with existing username
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'pass123',
        })
        .expect(201);

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'pass456',
        })
        .expect(409);
    });

    it('should handle authorization errors correctly', async () => {
      // Register regular user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          password: 'pass123',
        })
        .expect(201);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user1',
          password: 'pass123',
        })
        .expect(200);

      const userToken = loginRes.body.token;

      // Try to access admin-only routes
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across operations', async () => {
      // Create admin and user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'admin123',
          isAdmin: true,
        })
        .expect(201);

      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user',
          password: 'user123',
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      const adminToken = adminLogin.body.token;
      const userId = userRes.body.user.id;

      // Create task assigned to user
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'User Task',
          description: 'Task for user',
          userId: userId,
        })
        .expect(201);

      const taskId = taskRes.body.id;

      // Verify task is properly assigned
      const getUserTasksRes = await request(app)
        .get(`/api/users/${userId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getUserTasksRes.body).toHaveLength(1);
      expect(getUserTasksRes.body[0].id).toBe(taskId);

      // Delete user (admin can delete)
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is deleted but task might still exist (depending on implementation)
      await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
