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
import { PasswordResetRequestRepository } from '../repositories/password-reset-request.repository';
import { PasswordResetRequest, PasswordResetStatus } from '../../../shared/schemas/password-reset-request.entity';
import { MailService } from '../../../providers/mail/mail.service';
import { PasswordResetCodeEmailDto } from '../../../providers/mail/dto/email.dto';
import { LoginAttemptService } from './login-attempt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly RESET_CODE_EXPIRY_MINUTES = 30;

  constructor(
    private usersRepo: UsersRepository,
    private rolesRepo: RoleRepository,
    private userRolesRepo: UserRoleRepository,
    private jwtService: JwtService,
    private otpService: OtpService,
    private passwordResetRequestRepo: PasswordResetRequestRepository,
    private mailService: MailService,
    private loginAttemptService: LoginAttemptService,
  ) {}

  async register(dto: RegisterDto, otpCode?: string) {

    const existing = await this.usersRepo.findOne({
      where: { email: dto.email } as any,
    } as any);
    if (existing) throw new BadRequestException('Email already in use');


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

  async login(dto: LoginDto, options?: { allowAdmin?: boolean; ip?: string }) {
    const ip = options?.ip || '127.0.0.1';
    
    // Kiểm tra xem IP có bị chặn không
    const blockStatus = await this.loginAttemptService.isBlocked(ip);
    if (blockStatus.blocked) {
      const remainingSeconds = await this.loginAttemptService.getRemainingBlockTime(ip);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      throw new UnauthorizedException(
        `Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`
      );
    }

    let user: Users | null = null;
    let loginFailed = false;
    
    try {
      if (dto.email) {
        user = await this.usersRepo.findOne({
          where: { email: dto.email } as any,
          relations: ['roles', 'roles.role', 'theater'],
        } as any);
      } else if (dto.phone) {
        user = await this.usersRepo.findOne({
          where: { phone: dto.phone } as any,
          relations: ['roles', 'roles.role', 'theater'],
        } as any);
      }
      
      if (!user) {
        loginFailed = true;
        throw new UnauthorizedException('Invalid credentials');
      }
      
      
      if (user.status === 'BLOCKED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }
      
      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) {
        loginFailed = true;
        throw new UnauthorizedException('Invalid credentials');
      }
      
      
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean) as string[];
      const hasBackofficeRole = roleNames.some((role: string) =>
        ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ADMIN', 'admin', 'EMPLOYEE', 'employee'].includes(role),
      );
      
      
      if (hasBackofficeRole && !options?.allowAdmin) {
        loginFailed = true;
        throw new UnauthorizedException('Tài khoản mật khẩu không chính xác');
      }
      
      // Đăng nhập thành công - reset số lần đăng nhập sai
      await this.loginAttemptService.resetAttempts(ip);
      
      const token = this.jwtService.sign({ sub: user.id, email: user.email });
      
      const { password, ...profile } = user as any;
      // Đảm bảo theaterId được trả về (có thể từ theaterId hoặc theater.id)
      // TypeORM map theater_id từ DB thành theaterId trong entity
      const theaterId = (user as any).theaterId || (user as any).theater?.id || null;
      const userResponse = { 
        ...profile, 
        roles: roleNames, 
        theaterId: theaterId 
      };
      
      // Debug log để kiểm tra
      console.log('Auth login - User ID:', user.id, 'TheaterId:', theaterId, 'User object:', { theaterId: (user as any).theaterId });
      
      return { user: userResponse, accessToken: token };
    } catch (error) {
      // Nếu đăng nhập thất bại, ghi nhận lần đăng nhập sai
      if (loginFailed || error instanceof UnauthorizedException) {
        await this.loginAttemptService.recordFailedAttempt(ip);
      }
      throw error;
    }
  }


  async loginWithGoogle(dto: GoogleLoginDto) {
    try {
      
      const googleUser = await this.verifyGoogleToken(dto.idToken);
      
      if (!googleUser || !googleUser.email) {
        throw new UnauthorizedException('Không thể xác thực thông tin Google');
      }

      
      let user = await this.usersRepo.findOne({
        where: { email: googleUser.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);

      
      if (!user) {
        const nameParts = googleUser.name?.split(' ') || ['User', ''];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        user = this.usersRepo.create({
          firstName,
          lastName,
          email: googleUser.email,
          password: randomPassword,
          avatar: googleUser.picture,
        } as any);

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
          this.logger.warn('Failed to assign role to Google user', e);
        }

       
        user = await this.usersRepo.findOne({
          where: { id: saved.id } as any,
          relations: ['roles', 'roles.role'],
        } as any);
      } else {
        
        if (googleUser.picture && user.avatar !== googleUser.picture) {
          user.avatar = googleUser.picture;
          await this.usersRepo.save(user as any);
        }
      }

      if (!user) {
        throw new UnauthorizedException('Không thể tạo hoặc tìm thấy tài khoản');
      }

      
      if (user.status === 'BLOCKED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

    
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean) as string[];
      const hasBackofficeRole = roleNames.some((role: string) =>
        ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ADMIN', 'admin', 'EMPLOYEE', 'employee'].includes(role),
      );
      
      if (hasBackofficeRole) {
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

  
  async loginWithApple(dto: AppleLoginDto) {
    try {
      
      const appleUser = await this.verifyAppleToken(dto.identityToken);
      
      if (!appleUser || !appleUser.email) {
        throw new UnauthorizedException('Không thể xác thực thông tin Apple');
      }

     
      let user = await this.usersRepo.findOne({
        where: { email: appleUser.email } as any,
        relations: ['roles', 'roles.role'],
      } as any);

      
      if (!user) {
        
        const nameParts = (dto.fullName || appleUser.name || 'User').split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        user = this.usersRepo.create({
          firstName,
          lastName,
          email: appleUser.email || dto.email,
          password: randomPassword,
        } as any);

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
          this.logger.warn('Failed to assign role to Apple user', e);
        }

        
        user = await this.usersRepo.findOne({
          where: { id: saved.id } as any,
          relations: ['roles', 'roles.role'],
        } as any);
      }

      if (!user) {
        throw new UnauthorizedException('Không thể tạo hoặc tìm thấy tài khoản');
      }

      
      if (user.status === 'BLOCKED') {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

     
      const roleNames = (user.roles || [])
        .map((ur) => ur.role?.roleName)
        .filter(Boolean) as string[];
      const hasBackofficeRole = roleNames.some((role: string) =>
        ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ADMIN', 'admin', 'EMPLOYEE', 'employee'].includes(role),
      );
      
      if (hasBackofficeRole) {
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


  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    name?: string;
    picture?: string;
    sub: string;
  } | null> {
    try {
      
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonPayload);

      
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        this.logger.warn('Google token audience mismatch');
        return null;
      }

      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        this.logger.warn('Google token issuer mismatch');
        return null;
      }

      
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

 
  private async verifyAppleToken(identityToken: string): Promise<{
    email: string;
    name?: string;
    sub: string;
  } | null> {
    try {
      
      const base64Url = identityToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonPayload);

      
      if (payload.iss !== 'https://appleid.apple.com') {
        this.logger.warn('Apple token issuer mismatch');
        return null;
      }

      
      if (payload.aud !== process.env.APPLE_CLIENT_ID) {
        this.logger.warn('Apple token audience mismatch');
        return null;
      }

      
      if (payload.exp && payload.exp < Date.now() / 1000) {
        this.logger.warn('Apple token expired');
        return null;
      }

  

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

  private async checkIsEmployee(email: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { email } as any,
      relations: ['roles', 'roles.role'],
    } as any);
    
    if (!user) {
      return false;
    }
    
    const roleNames = (user.roles || [])
      .map((ur) => ur.role?.roleName)
      .filter(Boolean) as string[];
    
    return roleNames.includes('ROLE_EMPLOYEE');
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({
      where: { email } as any,
    } as any);
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }
    
    // Chỉ nhân viên mới được dùng luồng quên mật khẩu này
    const isEmployee = await this.checkIsEmployee(email);
    if (!isEmployee) {
      throw new BadRequestException('Chức năng này chỉ dành cho nhân viên. Vui lòng sử dụng chức năng quên mật khẩu thông thường.');
    }
    
    await this.otpService.sendOtp(email, OtpPurpose.RESET_PASSWORD);
  }

  async resetPassword(dto: { email: string; otpCode: string; newPassword: string }) {
    // Verify OTP
    await this.otpService.verifyOtp(dto.email, dto.otpCode, OtpPurpose.RESET_PASSWORD, true);

    // Update password
    const user = await this.usersRepo.findOne({
      where: { email: dto.email } as any,
    } as any);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.usersRepo.save(user as any);
  }

  private generateResetCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async verifyResetOtp(email: string, otpCode: string) {
    // Kiểm tra user có phải là nhân viên không
    const isEmployee = await this.checkIsEmployee(email);
    if (!isEmployee) {
      throw new BadRequestException('Chức năng này chỉ dành cho nhân viên.');
    }
    
    await this.otpService.verifyOtp(email, otpCode, OtpPurpose.RESET_PASSWORD, true);

    let request = await this.passwordResetRequestRepo.findOne({
      where: { email, status: PasswordResetStatus.PENDING } as any,
      order: { createdAt: 'DESC' } as any,
    } as any);

    if (!request) {
      request = this.passwordResetRequestRepo.create({
        email,
        status: PasswordResetStatus.PENDING,
      });
      await this.passwordResetRequestRepo.save(request as any);
    }

    return request;
  }

  async listResetRequests(status?: PasswordResetStatus) {
    const requests = await this.passwordResetRequestRepo.find({
      where: status ? ({ status } as any) : {},
      order: { createdAt: 'DESC' } as any,
    } as any);

    // Lấy thông tin user cho mỗi request để admin biết là nhân viên nào
    const requestsWithUserInfo = await Promise.all(
      requests.map(async (req) => {
        const user = await this.usersRepo.findOne({
          where: { email: req.email } as any,
          relations: ['roles', 'roles.role'],
        } as any);
        
        if (user) {
          const roleNames = (user.roles || [])
            .map((ur) => ur.role?.roleName)
            .filter(Boolean) as string[];
          
          return {
            ...req,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              roles: roleNames,
            },
          };
        }
        
        return {
          ...req,
          user: null,
        };
      })
    );

    return requestsWithUserInfo;
  }

  async getResetRequestStatus(email: string) {
    const isEmployee = await this.checkIsEmployee(email);
    if (!isEmployee) {
      throw new BadRequestException('Chức năng này chỉ dành cho nhân viên.');
    }

    const request = await this.passwordResetRequestRepo.findOne({
      where: { email } as any,
      order: { createdAt: 'DESC' } as any,
    } as any);

    if (!request) {
      return { status: null };
    }

    return {
      id: request.id,
      status: request.status,
      approvedAt: request.approvedAt,
      resetCode: request.resetCode ?? null,
      expiresAt: request.expiresAt ?? null,
    };
  }

  async adminApproveReset(id: number, adminId: number) {
    const request = await this.passwordResetRequestRepo.findOne({
      where: { id } as any,
    } as any);
    if (!request) {
      throw new BadRequestException('Yêu cầu không tồn tại');
    }
    if (request.status !== PasswordResetStatus.PENDING) {
      throw new BadRequestException('Yêu cầu đã được xử lý');
    }

    const resetCode = this.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.RESET_CODE_EXPIRY_MINUTES);

    request.status = PasswordResetStatus.APPROVED;
    request.resetCode = resetCode;
    request.expiresAt = expiresAt;
    request.approvedAt = new Date();
    request.approvedBy = adminId;
    await this.passwordResetRequestRepo.save(request as any);

    await this.mailService.sendPasswordResetCodeEmail({
      to: request.email,
      userName: request.email.split('@')[0],
      resetCode,
      expiresIn: this.RESET_CODE_EXPIRY_MINUTES,
    } as any as PasswordResetCodeEmailDto);

    return request;
  }

  async resetWithCode(email: string, resetCode: string, newPassword: string) {
    // Kiểm tra user có phải là nhân viên không
    const isEmployee = await this.checkIsEmployee(email);
    if (!isEmployee) {
      throw new BadRequestException('Chức năng này chỉ dành cho nhân viên.');
    }
    
    const request = await this.passwordResetRequestRepo.findOne({
      where: { email, resetCode, status: PasswordResetStatus.APPROVED } as any,
      order: { createdAt: 'DESC' } as any,
    } as any);

    if (!request) {
      throw new BadRequestException('Mã khôi phục không hợp lệ');
    }
    if (request.expiresAt && new Date() > request.expiresAt) {
      throw new BadRequestException('Mã khôi phục đã hết hạn');
    }

    const user = await this.usersRepo.findOne({
      where: { email } as any,
    } as any);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.usersRepo.save(user as any);

    request.status = PasswordResetStatus.COMPLETED;
    request.completedAt = new Date();
    await this.passwordResetRequestRepo.save(request as any);

    return { message: 'Đổi mật khẩu thành công' };
  }
}
