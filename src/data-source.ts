import { DataSource } from 'typeorm';
import { join as joinPath } from 'path';

/**
 * DataSource usado pelo TypeORM CLI no container (dist/data-source.js).
 * Usa variáveis de ambiente para conexão; migrations em dist/migrations/*.js.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'cinema',
  migrations: [joinPath(__dirname, 'migrations', '*.js')],
  synchronize: false,
});
