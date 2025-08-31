import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import aiRouter from './routes/ai';
import { requestLoggingMiddleware, errorLoggingMiddleware } from './middlewares/logging';

dotenv.config();

const app = express();

// Swagger definition options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SprintSync API',
      version: '1.0.0',
      description: 'API documentation for SprintSync backend',
    },
    servers: [
      { url: 'http://localhost:3000' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Files containing Swagger annotations
};

if (process.env.NODE_ENV === 'production') {
  // Secrets will be loaded asynchronously in production
  console.log('Production mode: Will load secrets from Parameter Store');
} else {
  console.log('Development mode: Using local environment variables');
}

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// CORS configuration

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3300', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging middleware - must come early to capture all requests
app.use(requestLoggingMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint for App Runner
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'SprintSync Backend'
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.send('SprintSync backend is running');
});

// Error logging middleware - must come after routes
app.use(errorLoggingMiddleware);

export default app;