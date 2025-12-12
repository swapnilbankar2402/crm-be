// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, raw } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- Tell NestJS to trust the proxy ---
  // This allows it to use the X-Forwarded-For header to get the real client IP.
  // The number '1' means it will trust the first hop (your direct proxy).
  // In a more complex setup, you might need to adjust this.
  app.set('trust proxy', 1);

  // Stripe webhook needs RAW
  app.use('/billing/webhook/stripe', raw({ type: 'application/json' }));

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('CRM API')
    .setDescription('SaaS Multi-Tenant CRM Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Users')
    .addTag('Tenants')
    .addTag('Roles')
    .addTag('Leads')
    .addTag('Pipelines')
    .addTag('Contacts')
    .addTag('Companies')
    .addTag('Deals')
    .addTag('Activities')
    .addTag('Emails')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api\n`);
}
bootstrap();
