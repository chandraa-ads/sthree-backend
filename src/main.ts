import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use ConfigService to get env variables
  const configService = app.get(ConfigService);

  // Enable CORS dynamically
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || '*', // allow frontend domain or all
    credentials: true,
  });

  // Helmet for security headers
  app.use(helmet());

  // Disable COOP/COEP to fix warnings for certain cross-origin requests
  app.use((req, res, next) => {
    res.removeHeader('Cross-Origin-Opener-Policy');
    res.removeHeader('Cross-Origin-Embedder-Policy');
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('User & Admin Panel API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Dynamic port binding for Render
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}
bootstrap();
