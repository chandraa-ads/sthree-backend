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

  // ✅ Use Render's PORT dynamically or fallback to 3000
  const port = Number(process.env.PORT) || Number(configService.get('PORT')) || 3000;
  const host = '0.0.0.0'; // Required for Render

  // ✅ Configure CORS (allow your frontend)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Basic security middleware
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Prevent COOP/COEP isolation issues (especially for image / iframe embeds)
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // ✅ Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz E-Commerce API')
    .setDescription('User, Admin, and Order Management API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Start application with helpful logs
  try {
    await app.listen(port, host);

    const publicUrl =
      process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

    logger.log(`🚀 Server is live at ${publicUrl}`);
    logger.log(`📘 Swagger UI available at ${publicUrl}/api`);
    logger.log('✅ Environment Summary:');
    logger.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    logger.log(`   DB_HOST: ${process.env.DB_HOST}`);
    logger.log(`   PORT: ${process.env.PORT || port}`);
    logger.log(`   FRONTEND_URL: ${frontendUrl}`);
  } catch (err) {
    logger.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
