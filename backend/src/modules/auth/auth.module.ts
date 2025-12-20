import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { AuthController } from './controllers/auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { UsersRepository } from './repositories/users.repository';
import { RoleRepository } from './repositories/role.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { OtpVerificationRepository } from './repositories/otp-verification.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../shared/schemas/users.entity';
import { Role } from '../../shared/schemas/role.entity';
import { UserRole } from '../../shared/schemas/user-role.entity';
import { OtpVerification } from '../../shared/schemas/otp-verification.entity';
import { PasswordResetRequest } from '../../shared/schemas/password-reset-request.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './auth.constants';
import { JwtStrategy } from './jwt/jwt.strategy';
import { QueueModule } from '../../providers/queue/queue.module';
import { PasswordResetRequestRepository } from './repositories/password-reset-request.repository';
import { MailModule } from '../../providers/mail/mail.module';
import { RedisCacheModule } from '../../providers/redis-cache/redis-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Role, UserRole, OtpVerification, PasswordResetRequest]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn as any },
    }),
    QueueModule,
    MailModule,
    RedisCacheModule,
  ],
  providers: [
    AuthService,
    OtpService,
    LoginAttemptService,
    JwtStrategy,
    UsersRepository,
    RoleRepository,
    UserRoleRepository,
    OtpVerificationRepository,
    PasswordResetRequestRepository,
  ],
  controllers: [AuthController, AdminAuthController],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
