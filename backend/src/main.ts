import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable trust proxy to get correct client IP behind proxy/load balancer
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  
  // Response compression - Reduce bandwidth by 60-80% for JSON/HTML
  // Supports gzip, deflate, and brotli (if Node.js version supports it)
  app.use(
    compression({
      // Only compress responses above this threshold (in bytes)
      threshold: 1024, // 1KB - compress responses larger than 1KB
      // Compression level (0-9), higher = better compression but slower
      // Level 6 provides good balance between compression ratio and speed
      level: 6,
      // Filter function to determine which responses should be compressed
      filter: (req, res) => {
        // Don't compress if client explicitly requests no compression
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use default compression filter (checks content-type, cache-control, etc.)
        // This will compress JSON, HTML, text, CSS, JS, XML, SVG, etc.
        return compression.filter(req, res);
      },
    }),
  );
  
  // Security headers configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS === 'true' || process.env.PROTOCOL === 'https';
  
  app.use(
    helmet({
      // X-Content-Type-Options: nosniff - Prevents MIME type sniffing
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"], // Allow Swagger UI iframe
        },
      },
      // X-Frame-Options: DENY - Prevents clickjacking
      frameguard: { action: 'deny' },
      // X-XSS-Protection: 1; mode=block - Enables XSS filter
      xssFilter: true,
      // Strict-Transport-Security (HSTS) - Only enable if using HTTPS
      hsts: isHttps
        ? {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
          }
        : false,
      // Referrer-Policy - Controls referrer information
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Additional security headers
      noSniff: true, // X-Content-Type-Options: nosniff
      hidePoweredBy: true, // Remove X-Powered-By header
      ...(isProduction && {
        // Additional production-only security settings
        crossOriginEmbedderPolicy: false, // Can be enabled if needed
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    }),
  );
  
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
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
