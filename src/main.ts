import dns from 'dns';
dns.setDefaultResultOrder('ipv4first'); // ✅ Force IPv4 resolution (fixes Supabase DNS on Render)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  logger.log('🚀 Bootstrapping application...');

  const app: INestApplication = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // ✅ Get port from Render or default to 3000
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : configService.get<number>('PORT') || 3000;

  // ✅ Always bind to 0.0.0.0 (Render requirement)
  const host = '0.0.0.0';

  // ✅ CORS setup
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Security headers
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

  // ✅ Start the server
  await app.listen(port, host);

  const publicUrl =
    process.env.RENDER_EXTERNAL_URL || `http://${host}:${port}`;
  logger.log(`✅ Server listening on ${host}:${port}`);
  logger.log(`📘 Swagger docs: ${publicUrl}/api`);
}

bootstrap().catch((err) => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
