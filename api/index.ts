import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';

const expressApp = express();
let cachedApp: express.Express | null = null;

export default async function handler(req: Request, res: Response) {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    app.enableCors({ origin: '*', credentials: true });
    app.use(helmet());
    await app.init();
    cachedApp = expressApp;
  }

  return cachedApp(req, res);
}
