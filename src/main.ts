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

  // ✅ Get frontend URL and port safely
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  const port = process.env.PORT || configService.get<number>('PORT') || 3000;

  // ✅ CORS setup
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // ✅ Security middleware
  app.use(helmet());

  // ✅ Disable COOP/COEP headers to avoid browser isolation issues
  app.use((req: any, res: { setHeader: (arg0: string, arg1: string) => void; }, next: () => void) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // ✅ Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('User & Admin Panel API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // ✅ Start the server
  await app
    .listen(port)
    .then(() =>
      console.log(
        `🚀 Server running at http://localhost:${port} (Render/Local Ready)`
      ),
    )
    .catch((err) => console.error('❌ Failed to start server:', err));
}

bootstrap();
