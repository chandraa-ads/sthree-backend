import dns from 'dns';
dns.setDefaultResultOrder('ipv4first'); // ✅ Fix Supabase DNS issue on Render

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Bootstrapping application...');

  const app: INestApplication = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ✅ Read PORT and DB_HOST from environment
  const port = parseInt(process.env.PORT || '3000', 10);
  const dbHost = configService.get<string>('DB_HOST');

  // ✅ Log to confirm what Render sees
  logger.log(`🧠 DB_HOST => ${dbHost}`);

  // ✅ Setup CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Security headers
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz API')
    .setDescription('Admin, Products, Orders, Users, Attendance')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  app.setGlobalPrefix('api');

  // ✅ Start server
  await app.listen(port);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

  logger.log(`✅ Server running on ${publicUrl}`);
  logger.log(`📘 Swagger docs available at: ${publicUrl}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
