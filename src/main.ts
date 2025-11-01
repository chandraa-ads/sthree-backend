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

  // ✅ Render assigns a port dynamically
  const port = parseInt(process.env.PORT || '10000', 10);
  const host = '0.0.0.0'; // ✅ required for Render

  // ✅ Enable CORS (allow your frontend)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Helmet for security
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle('Sthree Trendz E-Commerce API')
    .setDescription('API documentation for Sthree Trendz Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ Start the server
  await app.listen(port, host);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

  logger.log(`🚀 Server running at ${publicUrl}`);
  logger.log(`📘 Swagger UI at ${publicUrl}/api`);
  logger.log(`✅ Listening on port: ${port}`);
}

bootstrap();
