import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Users } from '../../../shared/schemas/users.entity';
import { RegisterDto } from '../dtos/request/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dtos/request/login.dto';
import { UsersRepository } from '../repositories/users.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { OtpService } from './otp.service';
import { OtpPurpose } from '../../../shared/schemas/otp-verification.entity';
import { GoogleLoginDto } from '../dtos/request/google-login.dto';
import { AppleLoginDto } from '../dtos/request/apple-login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersRepo: UsersRepository,
    private rolesRepo: RoleRepository,
    private userRolesRepo: UserRoleRepository,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto, otpCode?: string) {
    // Kiểm tra email đã tồn tại chưa
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email } as any,
    } as any);
    if (existing) throw new BadRequestException('Email already in use');

    // Nếu có OTP code, verify OTP trước và đánh dấu đã sử dụng
    if (otpCode) {
      await this.otpService.verifyOtp(dto.email, otpCode, OtpPurpose.REGISTER, true);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
    });

    const saved = await this.usersRepo.save(user as any);
    try {
      const role = await this.rolesRepo.findOne({
        where: { roleName: 'ROLE_USER' } as any,
      } as any);
      if (role) {
        await this.userRolesRepo.save(
          this.userRolesRepo.create({
            userId: saved.id,
            roleId: role.id,
          } as any) as any,
        );
      }
    } catch (e) {
      /* empty */
    }
    const reloaded = await this.usersRepo.findOne({
      where: { id: saved.id } as any,
      relations: ['roles', 'roles.role'],
    } as any);
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });
    const { password, ...profile } = reloaded as any;
    const roleNames = (reloaded?.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean);
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }

  async validateUserByEmail(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { email } as any,
    } as any);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    const { password: pw, ...profile } = user as any;
    return profile as any;
  }

  async login(dto: LoginDto, options?: { allowAdmin?: boolean }) {
    let user: Users | null = null;
    if (dto.email) {
      user = await this.usersRepo.findOne({
        where: { email: dto.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);
    } else if (dto.phone) {
      user = await this.usersRepo.findOne({
        where: { phone: dto.phone } as any,
        relations: ['roles', 'roles.role'],
      } as any);
    }
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    // Kiểm tra tài khoản có bị khóa không
    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }
    
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    
    // Kiểm tra role - từ chối admin đăng nhập vào user app
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean) as string[];
    const isAdmin = roleNames.some(
      (role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'admin'
    );
    
    // Trả về lỗi chung chung để bảo mật, không tiết lộ tài khoản là admin
    if (isAdmin && !options?.allowAdmin) {
      throw new UnauthorizedException('Tài khoản mật khẩu không chính xác');
    }
    
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...profile } = user as any;
    return { user: { ...profile, roles: roleNames }, accessToken: token };
  }

  /**
   * Đăng nhập/Đăng ký với Google
   * Frontend gửi Google ID token, backend verify và tạo/login user
   */
  async loginWithGoogle(dto: GoogleLoginDto) {
    try {
      // Verify Google ID token
      const googleUser = await this.verifyGoogleToken(dto.idToken);
      
      if (!googleUser || !googleUser.email) {
        throw new UnauthorizedException('Không thể xác thực thông tin Google');
      }

      // Tìm user theo email
      let user = await this.usersRepo.findOne({
        where: { email: googleUser.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);

      // Nếu chưa có user, tạo mới
      if (!user) {
        const nameParts = googleUser.name?.split(' ') || ['User', ''];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Tạo password random (user không cần dùng password khi login bằng Google)
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        user = this.usersRepo.create({
          firstName,
          lastName,
          email: googleUser.email,
          password: randomPassword,
          avatar: googleUser.picture,
        } as any);

        const saved = await this.usersRepo.save(user as any);

        // Gán role USER
        try {
          const role = await this.rolesRepo.findOne({
            where: { roleName: 'ROLE_USER' } as any,
          } as any);
          if (role) {
            await this.userRolesRepo.save(
              this.userRolesRepo.create({
                userId: saved.id,
                roleId: role.id,
              } as any) as any,
            );
          }
        } catch (e) {
          this.logger.warn('Failed to assign role to Google user', e);
        }

        // Reload với relations
        user = await this.usersRepo.findOne({
          where: { id: saved.id } as any,
          relations: ['roles', 'roles.role'],
        } as any);
      } else {
        // Cập nhật avatar nếu có
        if (googleUser.picture && user.avatar !== googleUser.picture) {
          user.avatar = googleUser.picture;
          await this.usersRepo.save(user as any);
        }
      }

      if (!user) {
        throw new UnauthorizedException('Không thể tạo hoặc tìm thấy tài khoản');
      }

      // Kiểm tra tài khoản có bị khóa không
      if (user.status === 'BLOCKED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

      // Kiểm tra role - từ chối admin
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean) as string[];
      const isAdmin = roleNames.some(
        (role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'admin'
      );
      
      if (isAdmin) {
        throw new UnauthorizedException('Tài khoản mật khẩu không chính xác');
      }

      const token = this.jwtService.sign({ sub: user.id, email: user.email });
      const { password, ...profile } = user as any;
      return { user: { ...profile, roles: roleNames }, accessToken: token };
    } catch (error) {
      this.logger.error('Google login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Đăng nhập Google thất bại');
    }
  }

  /**
   * Đăng nhập/Đăng ký với Apple
   */
  async loginWithApple(dto: AppleLoginDto) {
    try {
      // Verify Apple identity token
      const appleUser = await this.verifyAppleToken(dto.identityToken);
      
      if (!appleUser || !appleUser.email) {
        throw new UnauthorizedException('Không thể xác thực thông tin Apple');
      }

      // Tìm user theo email
      let user = await this.usersRepo.findOne({
        where: { email: appleUser.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);

      // Nếu chưa có user, tạo mới
      if (!user) {
        // Sử dụng fullName từ dto nếu có (chỉ có lần đầu tiên)
        const nameParts = (dto.fullName || appleUser.name || 'User').split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Tạo password random
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        user = this.usersRepo.create({
          firstName,
          lastName,
          email: appleUser.email || dto.email,
          password: randomPassword,
        } as any);

        const saved = await this.usersRepo.save(user as any);

        // Gán role USER
        try {
          const role = await this.rolesRepo.findOne({
            where: { roleName: 'ROLE_USER' } as any,
          } as any);
          if (role) {
            await this.userRolesRepo.save(
              this.userRolesRepo.create({
                userId: saved.id,
                roleId: role.id,
              } as any) as any,
            );
          }
        } catch (e) {
          this.logger.warn('Failed to assign role to Apple user', e);
        }

        // Reload với relations
        user = await this.usersRepo.findOne({
          where: { id: saved.id } as any,
          relations: ['roles', 'roles.role'],
        } as any);
      }

      if (!user) {
        throw new UnauthorizedException('Không thể tạo hoặc tìm thấy tài khoản');
      }

      // Kiểm tra tài khoản có bị khóa không
      if (user.status === 'BLOCKED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

      // Kiểm tra role - từ chối admin
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean) as string[];
      const isAdmin = roleNames.some(
        (role: string) => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'admin'
      );
      
      if (isAdmin) {
        throw new UnauthorizedException('Tài khoản mật khẩu không chính xác');
      }

      const token = this.jwtService.sign({ sub: user.id, email: user.email });
      const { password, ...profile } = user as any;
      return { user: { ...profile, roles: roleNames }, accessToken: token };
    } catch (error) {
      this.logger.error('Apple login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Đăng nhập Apple thất bại');
    }
  }

  /**
   * Verify Google ID token
   * Cần cài package: npm install google-auth-library
   */
  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    name?: string;
    picture?: string;
    sub: string;
  } | null> {
    try {
      // Cách 1: Sử dụng google-auth-library (cần cài package)
      // const { OAuth2Client } = require('google-auth-library');
      // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      // const ticket = await client.verifyIdToken({
      //   idToken,
      //   audience: process.env.GOOGLE_CLIENT_ID,
      // });
      // const payload = ticket.getPayload();
      // return {
      //   email: payload.email,
      //   name: payload.name,
      //   picture: payload.picture,
      //   sub: payload.sub,
      // };

      // Cách 2: Verify JWT token đơn giản (decode và verify signature)
      // Tạm thời decode token để lấy thông tin (trong production nên verify signature)
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonPayload);

      // Verify audience và issuer
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        this.logger.warn('Google token audience mismatch');
        return null;
      }

      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        this.logger.warn('Google token issuer mismatch');
        return null;
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        this.logger.warn('Google token expired');
        return null;
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
      };
    } catch (error) {
      this.logger.error('Error verifying Google token:', error);
      return null;
    }
  }

  /**
   * Verify Apple identity token
   * Apple sử dụng JWT token, cần verify signature với Apple public keys
   */
  private async verifyAppleToken(identityToken: string): Promise<{
    email: string;
    name?: string;
    sub: string;
  } | null> {
    try {
      // Decode JWT token
      const base64Url = identityToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonPayload);

      // Verify issuer
      if (payload.iss !== 'https://appleid.apple.com') {
        this.logger.warn('Apple token issuer mismatch');
        return null;
      }

      // Verify audience (client_id)
      if (payload.aud !== process.env.APPLE_CLIENT_ID) {
        this.logger.warn('Apple token audience mismatch');
        return null;
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        this.logger.warn('Apple token expired');
        return null;
      }

      // Note: Trong production, cần verify signature với Apple public keys
      // Có thể sử dụng: npm install jsonwebtoken và fetch Apple public keys
      // https://appleid.apple.com/auth/keys

      return {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
      };
    } catch (error) {
      this.logger.error('Error verifying Apple token:', error);
      return null;
    }
  }
}
