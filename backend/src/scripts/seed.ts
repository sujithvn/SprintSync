import { db, client } from '../db';
import { users, tasks } from '../models/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    
    let insertedUsers = existingUsers;
    
    if (existingUsers.length === 0) {
      // Hash passwords for seed users
      const adminPassword = await bcrypt.hash('admin123', 12);
      const developerPassword = await bcrypt.hash('dev123', 12);
      const designerPassword = await bcrypt.hash('design123', 12);
      
      // Insert users only if none exist
      insertedUsers = await db.insert(users).values([
        { username: 'admin', password: adminPassword, isAdmin: true },
        { username: 'developer', password: developerPassword, isAdmin: false },
        { username: 'designer', password: designerPassword, isAdmin: false },
      ]).returning();
      console.log('✅ Users seeded:', insertedUsers.length);
      console.log('ℹ️  Default passwords: admin123, dev123, design123');
    } else {
      console.log('ℹ️  Users already exist, skipping user creation');
    }

    // Check if tasks already exist
    const existingTasks = await db.select().from(tasks);
    
    if (existingTasks.length === 0) {
      // Get user IDs for task assignment
      const adminUser = insertedUsers.find(u => u.username === 'admin');
      const developerUser = insertedUsers.find(u => u.username === 'developer');
      const designerUser = insertedUsers.find(u => u.username === 'designer');

      if (!adminUser || !developerUser || !designerUser) {
        throw new Error('Failed to find required users');
      }

      // Insert tasks
      const insertedTasks = await db.insert(tasks).values([
        {
          title: 'Setup Docker Environment',
          description: 'Configure Docker and docker-compose for development',
          status: 'in_progress',
          totalMinutes: 60,
          userId: adminUser.id,
        },
        {
          title: 'Design User Interface',
          description: 'Create wireframes and design system',
          status: 'todo',
          totalMinutes: 0,
          userId: designerUser.id,
        },
        {
          title: 'Implement Authentication',
          description: 'Add JWT-based user authentication',
          status: 'todo',
          totalMinutes: 0,
          userId: developerUser.id,
        },
      ]).returning();

      console.log('✅ Tasks seeded:', insertedTasks.length);
    } else {
      console.log('ℹ️  Tasks already exist, skipping task creation');
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the database connection to allow the process to exit
    await client.end();
  }
}

// Run the seed function
seed().catch(console.error);
