# SprintSync

Internal task management tool for AI consultancy engineers with LLM-powered planning assistance.

## Tech Stack

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- JWT authentication
- OpenAI GPT-3.5-turbo integration
- Swagger API documentation

**Frontend:**
- React with TypeScript
- Vite build tool
- Tailwind CSS
- Axios for API calls

**Infrastructure:**
- Docker & Docker Compose
- AWS App Runner (backend)
- AWS Amplify (frontend)
- AWS RDS PostgreSQL (database)

## Features

### Core Functionality
- User authentication (JWT-based)
- Task CRUD operations with status transitions (To Do → In Progress → Done)
- AI-powered task description suggestions
- User and task management
- Admin dashboard with user statistics

### AI Assistance
- Task description generation from titles
- Estimated time and tag suggestions
- User recommendations based on skills matching
- OpenAI integration with intelligent fallbacks

### Admin Features
- Top users analytics endpoint
- Task assignment to team members
- User management and statistics

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 22+ (for local development)
- AWS CLI (for deployment)

### Local Development

1. **Clone and setup:**
```bash
git clone <repository-url>
cd SprintSync
```

2. **Environment setup:**
```bash
# Backend environment
cp backend/.env.example backend/.env
# Add your OpenAI API key and database credentials

# Frontend environment  
cp frontend/.env.example frontend/.env
# Add backend API URL
```

3. **Start with Docker:**
```bash
./docker.sh up
```

4. **Or run locally:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Database Setup

The database is automatically initialized with Docker. For manual setup:

```bash
cd backend
npm run db:push    # Create tables (recommended for development)
npm run db:seed    # Add demo data
```

For production migrations, use `npm run db:migrate` after generating migration files.

## API Documentation

Swagger documentation available at: `http://localhost:3000/api-docs`

### Key Endpoints

- `POST /auth/login` - User authentication
- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `POST /ai/suggest` - AI task suggestions
- `GET /users/top` - Top users statistics (admin)

## Project Structure

```
SprintSync/
├── backend/               # Express.js API
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes  
│   │   ├── models/        # Database schema
│   │   ├── middlewares/   # Auth, logging
│   │   ├── services/      # OpenAI integration
│   │   ├── config/        # Configuration & secrets
│   │   ├── scripts/       # Database seeding
│   │   ├── utils/         # JWT helpers
│   │   └── __tests__/     # Jest tests
│   ├── drizzle/          # Database migrations
│   ├── scripts/          # Build utilities
│   └── apprunner.yaml    # AWS App Runner config
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Route components
│   │   ├── services/     # API clients
│   │   └── types/        # TypeScript types
│   └── .env.example      # Environment template
├── database/             # Database initialization
├── observability/        # Logging stack (WIP)
├── scripts/              # Deployment scripts
├── .github/workflows/    # CI/CD pipelines
├── docker-compose*.yml   # Docker configurations
└── README.md
```

## Deployment

**Production URLs:**
- Frontend: https://main.d3ajb4ipr3lj54.amplifyapp.com
- Backend: https://6fzqnpksmi.us-east-1.awsapprunner.com

**Deploy commands:**
```bash
# Automatic deployment on git push
git push origin main    # Triggers both backend and frontend deployment

# Manual builds (if needed)
cd frontend && npm run build    # Build frontend
cd backend && npm run build     # Build backend
```

Both services deploy automatically:
- **Backend**: AWS App Runner monitors the main branch and deploys on push
- **Frontend**: AWS Amplify builds and deploys automatically on main branch updates

## Observability

**Current Status:** Draft implementation with structured logging

The project includes a logging middleware that captures:
- HTTP method and path
- User ID and latency
- Request/response details
- Error stack traces

**Observability Stack (WIP):**
- Loki for log aggregation
- Grafana for visualization
- Promtail for log shipping
- Local monitoring of AWS production logs


## Development

### Database Operations
```bash
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

### Testing
```bash
npm test            # Run Jest tests
npm run test:watch  # Watch mode
```

### Building
```bash
npm run build       # Compile TypeScript
./docker.sh build   # Build Docker images
```

## Configuration

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://sprintsync_user:sprintsync_pass@localhost:5432/sprintsync
JWT_SECRET=your-super-secure-jwt-secret-here
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=development
PORT=3000
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
```

## Demo Data

Default users:
- admin / admin123 (Admin user)
- developer / password (Developer)
- designer / password (Designer)

Sample tasks are created with various statuses and assignments.


## License
@copyright