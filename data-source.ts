import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: Number(configService.get('DB_PORT')),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASS'),
  database: configService.get('DB_NAME'),
  ssl: { rejectUnauthorized: false },  // 👈 Required for Supabase
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
});
