import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, password, isAdmin = false } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUser.length > 0) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await db.insert(users).values({
        username,
        password: hashedPassword,
        isAdmin,
      }).returning({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin, // not recommended to send back this field
        createdAt: users.createdAt
      });

      if (!newUser[0]) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      // Generate token
      const token = generateToken({
        userId: newUser[0].id,
        username: newUser[0].username,
        isAdmin: newUser[0].isAdmin
      });

      return res.status(201).json({
        token,
        user: {
          id: newUser[0].id,
          username: newUser[0].username,
          isAdmin: newUser[0].isAdmin
        }
      });

    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user
      const user = await db.select().from(users).where(eq(users.username, username));
      if (user.length === 0 || !user[0]) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user[0].password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        userId: user[0].id,
        username: user[0].username,
        isAdmin: user[0].isAdmin
      });

      return res.json({
        token,
        user: {
          id: user[0].id,
          username: user[0].username,
          isAdmin: user[0].isAdmin
        }
      });

    } catch (error) {
      console.error('Error logging in user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const { verifyToken } = await import('../utils/jwt');
      const payload = verifyToken(token);

      // Optionally fetch fresh user data from database
      const user = await db.select({
        id: users.id,
        username: users.username,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, payload.userId));

      if (user.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.json({
        user: user[0]
      });

    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}
