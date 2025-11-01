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

  // ✅ Use Render’s dynamic port (Render automatically sets PORT)
  const port = parseInt(process.env.PORT || '10000', 10);
  const host = '0.0.0.0'; // Important for Render to bind properly

  // ✅ Allow frontend requests (CORS)
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Security middleware
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

  // ✅ Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sthree Trendz API')
    .setDescription('Admin, Products, Orders, Users')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port, host);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

  logger.log(`🚀 Server started at: ${publicUrl}`);
  logger.log(`📘 Swagger docs at: ${publicUrl}/api`);
  logger.log(`✅ Listening on port: ${port}`);
}

bootstrap();
