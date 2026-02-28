import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
    }),
  );

  const nodeEnv = configService.get<string>('NODE_ENV');

  const origin =
    nodeEnv === 'development'
      ? configService.get<string>('CLIENT_URL_DEV')
      : configService.get<string>('CLIENT_URL');

  app.enableCors({
    origin,
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
