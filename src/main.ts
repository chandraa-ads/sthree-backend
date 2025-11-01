// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // ✅ Always prefer Render’s dynamic port
  const port = process.env.PORT || configService.get<number>('PORT') || 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';

  // ✅ Enable CORS for frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Add Helmet for security headers
  app.use(helmet());

  // ✅ Avoid COOP/COEP isolation issues
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // ✅ Swagger documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('User & Admin Panel API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Start the server (important: 0.0.0.0 for Render)
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server running at http://0.0.0.0:${port}`);
    console.log('Environment variables:', {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
