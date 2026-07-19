import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { sequelize } from './config/database.js';
import './entity/Article.js';
import './entity/DownloadToken.js';
import './entity/Purchase.js';
import './entity/User.js';
import { router } from './routes.js';
import { seedData } from './seed.js';

dotenv.config();

export const app = express();

let databaseReadyPromise: Promise<void> | null = null;

export const ensureDatabaseReady = async (): Promise<void> => {
  if (!databaseReadyPromise) {
    databaseReadyPromise = (async () => {
      await sequelize.authenticate();
      // Sequelize sync cree les tables si elles n'existent pas.
      await sequelize.sync({ alter: true });
      await seedData();
    })().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }
  await databaseReadyPromise;
};

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ELDBack Status Panel</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
      .wrap { max-width: 900px; margin: 0 auto; }
      .title { margin-bottom: 16px; }
      .panel { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; }
      .meta { color: #94a3b8; margin-bottom: 12px; font-size: 14px; }
      .item { border-radius: 10px; padding: 10px 12px; margin: 8px 0; border: 1px solid transparent; }
      .success { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.45); }
      .warning { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.45); }
      .error { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.45); }
      .label { font-weight: 700; text-transform: uppercase; font-size: 12px; margin-right: 8px; }
      .msg { font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h2 class="title">ELDBack - Panneau des statuts</h2>
      <div class="panel">
        <div id="meta" class="meta">Chargement...</div>
        <div id="list"></div>
      </div>
    </div>
    <script>
      async function refreshPanel() {
        const meta = document.getElementById('meta');
        const list = document.getElementById('list');
        try {
          const response = await fetch('/status/panel');
          const data = await response.json();
          meta.textContent = 'Derniere verification: ' + new Date(data.checkedAt).toLocaleString();
          list.innerHTML = data.items.map(item => (
            '<div class="item ' + item.level + '">' +
              '<span class="label">' + item.level + '</span>' +
              '<span class="msg">' + item.message + '</span>' +
            '</div>'
          )).join('');
        } catch (_error) {
          meta.textContent = 'Erreur de chargement du panneau.';
          list.innerHTML = '<div class="item error"><span class="label">error</span><span class="msg">Impossible de charger /status/panel</span></div>';
        }
      }
      refreshPanel();
      setInterval(refreshPanel, 10000);
    </script>
  </body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/status/panel', async (_req, res) => {
  const items: Array<{ level: 'success' | 'warning' | 'error'; message: string }> = [];

  items.push({ level: 'success', message: 'API Express active.' });

  if (process.env.DATABASE_URL) {
    items.push({ level: 'success', message: 'DATABASE_URL detectee.' });
  } else {
    items.push({ level: 'error', message: 'DATABASE_URL manquante.' });
  }

  try {
    await sequelize.authenticate();
    items.push({ level: 'success', message: 'Connexion PostgreSQL valide.' });
  } catch {
    items.push({ level: 'warning', message: 'Connexion PostgreSQL indisponible pour le moment.' });
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    items.push({ level: 'warning', message: 'Application en mode non-production.' });
  } else {
    items.push({ level: 'success', message: 'Application en mode production.' });
  }

  res.json({
    checkedAt: new Date().toISOString(),
    items
  });
});

app.use('/api', async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', router);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled API error:', error);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({
    message: error instanceof Error ? error.message : 'Une erreur interne est survenue',
    stack: error instanceof Error ? error.stack : undefined,
    error,
  });
});

const handler = (req: Request, res: Response) => app(req, res);

export default handler;
