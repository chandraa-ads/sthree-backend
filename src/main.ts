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

  // ✅ Always use Render’s dynamic PORT if available
  const port = Number(process.env.PORT) || Number(configService.get('PORT')) || 3000;
  const host = '0.0.0.0'; // Required for Render deployment

  // ✅ Allow your frontend origin (for CORS)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Basic Security Middleware
  app.use(helmet());

  // ✅ Prevent COOP/COEP isolation issues (for embedded content)
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // ✅ Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz E-Commerce API')
    .setDescription('User, Admin, and Order Management API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Graceful startup with environment logs
  try {
    await app.listen(port, host);
    logger.log(`🚀 Server is live at http://localhost:${port}`);
    logger.log(`Swagger UI available at http://localhost:${port}/api`);
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
