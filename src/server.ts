import { app } from './app.js';
import { sequelize } from './config/database.js';
import './entity/Article.js';
import './entity/User.js';
import { seedData } from './seed.js';

const port = Number(process.env.PORT ?? 4000);

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedData();
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
