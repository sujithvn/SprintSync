import { Request, Response } from 'express';
import { db } from '../db';
import { tasks, users } from '../models/schema';
import { eq } from 'drizzle-orm';

export class TaskController {
  static async getAllTasks(req: Request, res: Response) {
    try {
      if (req.user?.isAdmin) {
        // Admin can see all tasks
        const allTasks = await db.select().from(tasks);
        return res.json({
          success: true,
          data: allTasks,
        });
      } else {
        // Regular users can only see their own tasks
        const userTasks = await db.select().from(tasks).where(eq(tasks.userId, req.user?.userId || 0));
        return res.json({
          success: true,
          data: userTasks,
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
  }

  static async getTaskById(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id || '0');
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const task = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (task.length === 0 || !task[0]) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      // Check if user has permission to view this task
      if (!req.user?.isAdmin && task[0].userId !== req.user?.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      return res.json({
        success: true,
        data: task[0],
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async createTask(req: Request, res: Response) {
    try {
      const { title, description, status = 'todo', userId } = req.body;

      if (!title) {
        return res.status(400).json({ 
          success: false,
          error: 'Title is required' 
        });
      }

      // Determine the user ID for the task
      let assignedUserId = req.user?.userId; // Default to current user
      
      if (userId && req.user?.isAdmin) {
        // Admin can assign tasks to other users
        assignedUserId = userId;
        
        // Verify the assigned user exists
        const userExists = await db.select().from(users).where(eq(users.id, userId));
        if (userExists.length === 0) {
          return res.status(400).json({ 
            success: false,
            error: 'Assigned user does not exist' 
          });
        }
      }

      const newTask = await db.insert(tasks).values({
        title,
        description,
        status,
        userId: assignedUserId,
      }).returning();

      if (!newTask[0]) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to create task' 
        });
      }

      return res.status(201).json({
        success: true,
        data: newTask[0],
      });
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async updateTaskStatus(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id || '0');
      if (isNaN(taskId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid task ID' 
        });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ 
          success: false,
          error: 'Status is required' 
        });
      }

      // Validate status
      const validStatuses = ['todo', 'in_progress', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid status' 
        });
      }

      // Check if task exists and user has permission
      const existingTask = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (existingTask.length === 0 || !existingTask[0]) {
        return res.status(404).json({ 
          success: false,
          error: 'Task not found' 
        });
      }

      if (!req.user?.isAdmin && existingTask[0].userId !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const updatedTask = await db.update(tasks)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      if (!updatedTask[0]) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update task' 
       });
      }

      return res.json({
        success: true,
        data: updatedTask[0]
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async updateTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id || '0');
      if (isNaN(taskId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid task ID' 
        });
      }

      const { title, description, status, totalMinutes } = req.body;

      // Check if there's anything to update
      if (!title && !description && !status && totalMinutes === undefined) {
        return res.status(400).json({ 
          success: false,
          error: 'No fields to update' 
        });
      }

      // Check if task exists and user has permission
      const existingTask = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (existingTask.length === 0 || !existingTask[0]) {
        return res.status(404).json({ 
          success: false,
          error: 'Task not found' 
        });
      }

      if (!req.user?.isAdmin && existingTask[0].userId !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (status) {
        const validStatuses = ['todo', 'in_progress', 'done'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid status' 
          });
        }
        updateData.status = status;
      }
      if (totalMinutes !== undefined) updateData.totalMinutes = totalMinutes;

      const updatedTask = await db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning();

      if (!updatedTask[0]) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update task' 
        });
      }

      return res.json({
        success: true,
        data: updatedTask[0]
      });
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id || '0');
      if (isNaN(taskId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid task ID' 
        });
      }

      // Check if task exists and user has permission
      const existingTask = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (existingTask.length === 0 || !existingTask[0]) {
        return res.status(404).json({ 
          success: false,
          error: 'Task not found' 
        });
      }

      if (!req.user?.isAdmin && existingTask[0].userId !== req.user?.userId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied' 
        });
      }

      const deletedTask = await db.delete(tasks)
        .where(eq(tasks.id, taskId))
        .returning();

      if (!deletedTask[0]) {
        return res.status(500).json({ 
          success: false,
          error: 'Failed to delete task' 
        });
      }

      return res.json({ 
        success: true,
        message: 'Task deleted successfully',
        task: deletedTask[0] 
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
