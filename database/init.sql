-- SprintSync Database Initialization
-- This script will be run when the PostgreSQL container starts
-- 
-- Note: Schema will be managed by Drizzle ORM migrations
-- This file only ensures the database exists and is ready

-- Create the database if it doesn't exist (handled by Docker environment)
-- The actual tables will be created by Drizzle migrations

-- Optional: Create initial admin user after Drizzle migrations run
-- This can be moved to a seed script later