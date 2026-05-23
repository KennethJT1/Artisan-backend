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
  
  // Global rate limiting - generous for development
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,  // 15 minutes
      limit: 1000,               // 1000 requests per 15 min (was 100)
      skip: (req) => req.path === '/health', // Skip health checks
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // Stricter rate limiting for auth endpoints only
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,  // 15 minutes
      limit: 10,                 // 10 login attempts per 15 min
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true, // Don't count successful logins
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

  // Set trust proxy for Express (for correct IP detection behind proxies)
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance();
    instance.set('trust proxy', 1); // or true
  }
  
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
