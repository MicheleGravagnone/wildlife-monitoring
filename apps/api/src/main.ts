import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { API_PREFIX, configureApp } from './app.setup.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Torb - Wildlife monitoring')
    .setDescription('Wildlife monitoring project for the city of Łódź')
    .setVersion('1.0')
    .addTag('wildlife')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
