import { join } from 'path';
import { DataSource } from 'typeorm';

/**
 * Used by the TypeORM CLI (npm run migration:*). The app itself configures the
 * same entities and migrations in AppModule and runs pending migrations on start.
 * Reads the same DB_* variables as the app.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
