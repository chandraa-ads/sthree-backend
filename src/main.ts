import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';

// ✅ Setup pretty logging for Render console
console.log = (...args) => pino({ transport: { target: 'pino-pretty' } }).info(args.join(' '));

async function bootstrap() {
  console.log('🚀 Starting Nest app...');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  // 🔧 Log key DB + env details for Render debugging
  console.log('🔧 DB Config:', {
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    user: configService.get('DB_USER'),
    ssl: configService.get('DB_SSL'),
  });

  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  const port = process.env.PORT || configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(helmet());
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // 🚀 Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('User & Admin Panel API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`✅ App ready at http://localhost:${port}`);
}

bootstrap();
