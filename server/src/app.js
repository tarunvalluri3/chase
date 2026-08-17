import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import meRouter from './routes/me.js';
import tasksRouter from './routes/tasks.js';
import errorHandler from './middleware/errorHandler.js';
import { withClerkAuth } from './middleware/auth.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(withClerkAuth);

app.use('/api/health', healthRouter);
app.use('/api/me', meRouter);
app.use('/api/tasks', tasksRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

app.use(errorHandler);

export default app;
