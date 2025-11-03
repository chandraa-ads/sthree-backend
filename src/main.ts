import dns from 'dns';
dns.setDefaultResultOrder('ipv4first'); // ✅ Fix Supabase DNS resolution issue on Render

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Bootstrapping application...');

  const app: INestApplication = await NestFactory.create(AppModule, {
    cors: true,
  });
  const configService = app.get(ConfigService);

  // ✅ Render automatically injects PORT
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0'; // ✅ Required for Render

  // ✅ Global validation (optional but recommended)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ✅ Security headers
  app.use(helmet());
  app.use(
    helmet.crossOriginResourcePolicy({
      policy: 'cross-origin',
    }),
  );

  // ✅ CORS setup
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Swagger documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz API')
    .setDescription('API documentation for Admin, Products, Orders, and Users')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Start server
  logger.log(`Starting server on port ${port}...`);
  await app.listen(port, host);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  logger.log(`✅ Server running on: ${publicUrl}`);
  logger.log(`📘 Swagger docs available at: ${publicUrl}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
