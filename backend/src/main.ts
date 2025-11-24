import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT ?? 3000;
  const feOrigins = process.env.FE_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
  const sameOriginAllow = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (sameOriginAllow.includes(origin)) return callback(null, true);
      if (feOrigins && feOrigins.length > 0) {
        return callback(null, feOrigins.includes(origin));
      }
      return callback(null, true); 
    },
    credentials: true,
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Accept','Origin','X-Requested-With'],
    exposedHeaders: ['Content-Length','Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Tài liệu API hệ thống rạp phim')
    .setDescription('Tài liệu Swagger cho toàn bộ API: Lễ hội, Rạp, Phòng chiếu, Upload, Mail/Queue...')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt',
    )
    .addServer(`http://localhost:${port}`)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
  await app.listen(port);
  
  console.log('\n🚀 Server is running!');
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs\n`);
  

  const paths = Object.keys(document.paths || {});
  const tags = document.tags?.map(t => t.name) || [];
  
  console.log('📋 API Groups in Swagger:');
  tags.forEach((tag, index) => {
    const count = paths.filter(p => {
      const pathMethods = document.paths[p];
      return Object.values(pathMethods || {}).some((method: any) => 
        method?.tags?.includes(tag)
      );
    }).length;
    console.log(`   ${index + 1}. ${tag} (${count} endpoints)`);
  });
  
  console.log(`\n✅ Total: ${paths.length} endpoints across ${tags.length} groups\n`);
}
bootstrap();
