import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('🚀 Bootstrapping application...');

    const app: INestApplication = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    // ✅ Use dynamic Render port or fallback for local
    const port = parseInt(process.env.PORT || '10000', 10);
    const host = '0.0.0.0'; // Important for Render and Docker

    // ✅ Allow frontend requests (CORS)
    const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
    app.enableCors({
      origin: frontendUrl,
      credentials: true,
    });

    // ✅ Basic security (allow images and assets)
    app.use(helmet());
    app.use(
      helmet.crossOriginResourcePolicy({
        policy: 'cross-origin',
      }),
    );

    // ✅ Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sthree Trendz API')
      .setDescription('Admin, Products, Orders, Users')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    // ✅ Start server and confirm binding
    await app.listen(port, host);

    const publicUrl =
      process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

    logger.log(`✅ App listening on host: ${host}`);
    logger.log(`✅ App running on port: ${port}`);
    logger.log(`🚀 Server started at: ${publicUrl}`);
    logger.log(`📘 Swagger docs available at: ${publicUrl}/api`);
  } catch (err) {
    console.error('❌ Application failed to start:');
    console.error(err);
    process.exit(1);
  }
}

bootstrap();
