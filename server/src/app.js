import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import meRouter from './routes/me.js';
import errorHandler from './middleware/errorHandler.js';
import { withClerkAuth } from './middleware/auth.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(withClerkAuth);

app.use('/api/health', healthRouter);
app.use('/api/me', meRouter);

app.use(errorHandler);

export default app;
