import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ✅ Render uses dynamic PORT (provided via env)
  const port = parseInt(process.env.PORT || configService.get('PORT') || '3000', 10);
  const host = '0.0.0.0'; // required for Render

  // ✅ Enable CORS for your frontend
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Helmet for security
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Fix for COOP/COEP (Swagger and embeds)
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // ✅ Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz E-Commerce API')
    .setDescription('User, Admin, and Order Management API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  try {
    await app.listen(port, host);

    const publicUrl =
      process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

    logger.log(`🚀 Server is live at ${publicUrl}`);
    logger.log(`📘 Swagger UI available at ${publicUrl}/api`);
  } catch (err) {
    logger.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
