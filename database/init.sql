-- SprintSync Database Initialization
-- This script will be run when the PostgreSQL container starts

-- Create basic tables (will be replaced by Drizzle migrations later)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    total_minutes INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO users (username, is_admin) VALUES 
    ('admin', true),
    ('developer', false),
    ('designer', false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO tasks (title, description, status, total_minutes, user_id) VALUES 
    ('Setup Docker Environment', 'Configure Docker and docker-compose for development', 'in_progress', 60, 1),
    ('Design User Interface', 'Create wireframes and design system', 'todo', 0, 3),
    ('Implement Authentication', 'Add JWT-based user authentication', 'todo', 0, 2)
ON CONFLICT DO NOTHING;
