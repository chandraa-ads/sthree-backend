import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Bootstrapping application...');

  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // ✅ Use Render or local port
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : configService.get<number>('PORT') || 3000;

  // ✅ Use host 0.0.0.0 (Render) or localhost (local)
  const host = process.env.RENDER ? '0.0.0.0' : 'localhost';

  // ✅ CORS for frontend
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Security middleware
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz API')
    .setDescription('Admin, Products, Orders, Users')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Start server and ensure Render detects it
  await app.listen(port, host);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://${host}:${port}`;

  logger.log(`✅ Listening on ${host}:${port}`);
  logger.log(`🚀 Server started at: ${publicUrl}`);
  logger.log(`📘 Swagger docs at: ${publicUrl}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
