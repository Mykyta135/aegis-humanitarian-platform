import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core'; // No APP_GUARD here
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Good practice: strips properties not in the DTO
    transform: true, // CRITICAL: allows transformation of incoming data
  }));

  const config = new DocumentBuilder()
    .setTitle('Aegis Platform API')
    .setDescription(
      'API documentation for the Aegis humanitarian coordination platform',
    )
    .setVersion('1.0')
    .addTag('aegis')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
