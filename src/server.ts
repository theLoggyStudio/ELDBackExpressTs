import { app, ensureDatabaseReady } from './app.js';

const port = Number(process.env.PORT ?? 4000);

const start = async () => {
  await ensureDatabaseReady();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API démarrée sur http://localhost:${port}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Erreur de démarrage backend:', error);
  process.exit(1);
});
