import dns from 'dns';
dns.setDefaultResultOrder('ipv4first'); // ✅ Force IPv4 to avoid Supabase DNS issues

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';
import dnsPromises from 'dns/promises';

// ✅ Pretty & color-coded logs for Render
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  },
});
console.log = (...args) => logger.info(args.join(' '));

async function bootstrap() {
  console.log('🚀 Starting Nest app...');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  // 🔧 Print critical DB + ENV vars
  console.log('🔧 DB Config:', {
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    user: configService.get('DB_USER'),
    ssl: configService.get('DB_SSL'),
  });

  // 🧠 Optional: Test DNS resolution before DB connect
  const dbHost = configService.get('DB_HOST');
  try {
    const res = await dnsPromises.lookup(dbHost || '', { family: 4 });
    console.log(`✅ DNS Lookup OK for ${dbHost}: ${res.address}`);
  } catch (err) {
    console.error(`❌ DNS Lookup failed for ${dbHost}:`, err.message);
  }

  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  const port = Number(process.env.PORT || configService.get<number>('PORT') || 3000);

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // 🛡️ Security setup
  app.use(helmet());
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // 📘 Swagger Docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('User & Admin Panel API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  console.log('🧠 Render DB_HOST:', configService.get('DB_HOST'));

  await app.listen(port);
  console.log(`✅ App is live and running at: http://localhost:${port}`);
}

bootstrap();
