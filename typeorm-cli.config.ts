import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';

config(); // Load .env file

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.ts'], // Point to TS files directly
  migrations: ['src/database/migrations/*.ts'], // Point to TS files directly
  synchronize: false, // ALWAYS FALSE for migrations
});

// npm run migration:generate src/database/migrations/InitialSchema