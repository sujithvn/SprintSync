import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';

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


const swaggerDocs = swaggerJsdoc(swaggerOptions);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3300', 'http://localhost:3000'], // Allow frontend and local dev
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);

app.get('/', (_req: Request, res: Response) => {
  res.send('SprintSync backend is running');
});

export default app;