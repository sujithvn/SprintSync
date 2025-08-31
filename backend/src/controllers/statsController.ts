import { Request, Response } from 'express';
import { db } from '../db';
import { users, tasks } from '../models/schema';
import { sql, eq, desc } from 'drizzle-orm';

export class StatsController {
  /**
   * Get top users by total time logged
   * Admin only endpoint
   */
  static async getTopUsers(req: Request, res: Response) {
    try {
      // Check if user is admin (auth middleware should have set req.user)
      const currentUser = (req as any).user;
      if (!currentUser?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Get top users by total minutes logged
      const topUsers = await db
        .select({
          userId: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
          totalMinutes: sql<number>`COALESCE(SUM(${tasks.totalMinutes}), 0)`.as('totalMinutes'),
          taskCount: sql<number>`COUNT(${tasks.id})`.as('taskCount'),
          completedTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'done' THEN 1 END)`.as('completedTasks'),
          inProgressTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END)`.as('inProgressTasks'),
          todoTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'todo' THEN 1 END)`.as('todoTasks')
        })
        .from(users)
        .leftJoin(tasks, eq(users.id, tasks.userId))
        .groupBy(users.id, users.username, users.isAdmin)
        .orderBy(desc(sql`COALESCE(SUM(${tasks.totalMinutes}), 0)`))
        .limit(20); // Top 20 users

      // Format the response with additional calculated fields
      const formattedUsers = topUsers.map(user => ({
        ...user,
        totalHours: Math.round((user.totalMinutes / 60) * 100) / 100, // Round to 2 decimal places
        completionRate: user.taskCount > 0 ? Math.round((user.completedTasks / user.taskCount) * 100) : 0
      }));

      return res.json({
        success: true,
        data: {
          topUsers: formattedUsers,
          totalUsers: topUsers.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching top users:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get general platform statistics
   * Admin only endpoint
   */
  static async getPlatformStats(req: Request, res: Response) {
    try {
      // Check if user is admin
      const currentUser = (req as any).user;
      if (!currentUser?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Get platform-wide statistics
      const [userStats, taskStats] = await Promise.all([
        // User statistics
        db.select({
          totalUsers: sql<number>`COUNT(*)`.as('totalUsers'),
          adminUsers: sql<number>`COUNT(CASE WHEN ${users.isAdmin} = true THEN 1 END)`.as('adminUsers')
        }).from(users),

        // Task statistics
        db.select({
          totalTasks: sql<number>`COUNT(*)`.as('totalTasks'),
          completedTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'done' THEN 1 END)`.as('completedTasks'),
          inProgressTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 END)`.as('inProgressTasks'),
          todoTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'todo' THEN 1 END)`.as('todoTasks'),
          totalMinutes: sql<number>`COALESCE(SUM(${tasks.totalMinutes}), 0)`.as('totalMinutes')
        }).from(tasks)
      ]);

      const platformStats = {
        users: userStats[0] || { totalUsers: 0, adminUsers: 0 },
        tasks: {
          ...(taskStats[0] || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, todoTasks: 0, totalMinutes: 0 }),
          totalHours: Math.round(((taskStats[0]?.totalMinutes || 0) / 60) * 100) / 100,
          completionRate: (taskStats[0]?.totalTasks || 0) > 0 ? 
            Math.round(((taskStats[0]?.completedTasks || 0) / (taskStats[0]?.totalTasks || 1)) * 100) : 0
        }
      };

      return res.json({
        success: true,
        data: {
          ...platformStats,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
