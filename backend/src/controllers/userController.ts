import { Request, Response } from 'express';
import { db } from '../db';
import { users, tasks } from '../models/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class UserController {
  static async getAllUsers(_req: Request, res: Response) {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      }).from(users);
      
      return res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id || '0');
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check permissions: users can only access their own profile unless they're admin
      if (!req.user?.isAdmin && userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = await db.select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, userId));

      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserTasks(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id || '0');
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Users can only access their own tasks unless they're admin
      if (!req.user?.isAdmin && userId !== req.user?.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
      return res.json(userTasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id || '0');
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { username, password, isAdmin } = req.body;

      // Check if there's anything to update
      if (!username && !password && isAdmin === undefined) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, userId));
      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prepare update data
      const updateData: any = {};
      if (username) updateData.username = username;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Update user
      const updatedUser = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt
        });

      if (!updatedUser[0]) {
        return res.status(500).json({ error: 'Failed to update user' });
      }

      return res.json(updatedUser[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id || '0');
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, userId));
      if (existingUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user's tasks first to avoid foreign key constraint violation
      await db.delete(tasks).where(eq(tasks.userId, userId));

      // Delete user
      const deletedUser = await db.delete(users)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt
        });

      if (!deletedUser[0]) {
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      return res.json({ message: 'User deleted successfully', user: deletedUser[0] });

    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
