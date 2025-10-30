// data-source.ts
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';

// ✅ Load .env config first
dotenvConfig();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<string>('DB_PORT')) || 5432,
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASS'),
  database: configService.get<string>('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // ❌ Don't use synchronize in prod
  synchronize: false,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  // ✅ SSL enabled for Supabase / Render
  ssl:
    configService.get<string>('DB_SSL') === 'true'
      ? { rejectUnauthorized: false }
      : false,

  // ✅ Logging helps debug locally
  logging: configService.get<string>('NODE_ENV') !== 'production',
});
