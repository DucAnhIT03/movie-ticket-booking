/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { User } from './module/user/entities/user.entity';
import { Role } from './module/user/entities/role.entity';
import { UserRole } from './module/user/entities/user-role.entity';
import { Movie } from './module/movie/entities/movie.entity';
import { Genre } from './module/movie/entities/genres.entity';
import { MovieGenre } from './module/movie/entities/movie-genre.entity';
import { MovieModule } from './module/movie/movie.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const host = cfg.get<string>('MYSQL_HOST');
        const port = parseInt(cfg.get<string>('MYSQL_PORT') ?? '3306', 10);
        const username = cfg.get<string>('MYSQL_USER');
        const password = cfg.get<string>('MYSQL_PASSWORD');
        const database = cfg.get<string>('MYSQL_DB');
        if (!host || !username || !database) {
          throw new Error(
            'Missing MySQL configuration in environment. Please set MYSQL_HOST, MYSQL_USER and MYSQL_DB (see .env)',
          );
        }
        return {
          type: 'mysql' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [User, Role, UserRole, Movie, Genre, MovieGenre],
          synchronize: cfg.get<string>('TYPEORM_SYNC') === 'true',
          logging: cfg.get<string>('TYPEORM_LOGGING') === 'true',
        } as any;
      },
    }),
    AuthModule,
    UserModule,
    MovieModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
