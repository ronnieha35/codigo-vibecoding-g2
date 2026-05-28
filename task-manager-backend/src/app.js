import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import taskRoutes from './tasks/task.routes.js';
import userRoutes from './users/user.routes.js';
import swaggerSpec from './docs/swagger.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec));
app.get('/api-docs/', swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

export default app;
