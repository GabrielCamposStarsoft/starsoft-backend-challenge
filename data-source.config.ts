import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource usado pelo CLI do TypeORM (migration:generate, migration:run).
 * Carrega variáveis de ambiente do .env. Para a aplicação Nest, ver src/app-data-source.ts.
 */
export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'cinema',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: false,
});
