import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { router } from './routes.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', router);

const handler = (req: Request, res: Response) => app(req, res);

export default handler;
