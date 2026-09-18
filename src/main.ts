import {
  ValidationPipe,
} from '@nestjs/common';
import {
  NestFactory,
} from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule);

  const corsOrigin =
    process.env.CORS_ORIGIN
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

  app.enableCors({
    origin:
      corsOrigin?.length
        ? corsOrigin
        : false,

    methods: [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(
    process.env.PORT ?? 3000,
  );
}

bootstrap();