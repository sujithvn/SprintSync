import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

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
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Files containing Swagger annotations
};


const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (_req: Request, res: Response) => {
  res.send('SprintSync backend is running');
});

export default app;