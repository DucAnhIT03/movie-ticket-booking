import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { RegisterDto } from '../dtos/request/register.dto';
import { LoginDto } from '../dtos/request/login.dto';
import { SendOtpDto } from '../dtos/request/send-otp.dto';
import { VerifyOtpDto } from '../dtos/request/verify-otp.dto';
import { OtpPurpose } from '../../../shared/schemas/otp-verification.entity';
import { GoogleLoginDto } from '../dtos/request/google-login.dto';
import { AppleLoginDto } from '../dtos/request/apple-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
  ) {}

  @Post('send-otp')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Gửi mã OTP xác thực',
    description: 'Gửi mã OTP 6 chữ số đến email để xác thực đăng ký'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP đã được gửi thành công',
    schema: {
      example: {
        message: 'OTP đã được gửi đến email của bạn'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email không hợp lệ',
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    await this.otpService.sendOtp(dto.email, dto.purpose || OtpPurpose.REGISTER);
    return { message: 'OTP đã được gửi đến email của bạn' };
  }

  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Xác thực mã OTP',
    description: 'Xác thực mã OTP đã được gửi đến email'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP hợp lệ',
    schema: {
      example: {
        message: 'OTP hợp lệ'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    await this.otpService.verifyOtp(dto.email, dto.otpCode, OtpPurpose.REGISTER);
    return { message: 'OTP hợp lệ' };
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới với email, số điện thoại và mật khẩu. Yêu cầu OTP đã được xác thực.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Nguyen',
          lastName: 'Van A'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Email đã tồn tại, OTP không hợp lệ hoặc dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email already in use',
        error: 'Bad Request'
      }
    }
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'Nguyen' },
        lastName: { type: 'string', example: 'Van A' },
        email: { type: 'string', example: 'user@example.com' },
        phone: { type: 'string', example: '0912345678' },
        password: { type: 'string', example: 'P@ssw0rd' },
        otpCode: { type: 'string', example: '123456', description: 'Mã OTP đã được gửi đến email' },
      },
      required: ['firstName', 'lastName', 'email', 'phone', 'password', 'otpCode'],
    },
  })
  async register(@Body() dto: RegisterDto & { otpCode?: string }) {
    return this.authService.register(dto, dto.otpCode);
  }

  @HttpCode(200)
  @Post('login')
  @ApiOperation({ 
    summary: 'Đăng nhập (email hoặc số điện thoại)',
    description: 'Đăng nhập bằng email hoặc số điện thoại kèm mật khẩu. Trả về JWT token để sử dụng cho các API cần authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: { 
      example: { 
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzODAwMDAwMCwiZXhwIjoxNjM4NjA0ODAwfQ...'
      } 
    } 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Thông tin đăng nhập không đúng',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      emailLogin: {
        summary: 'Login with email',
        value: { email: 'user@example.com', password: 'P@ssw0rd' },
      },
      phoneLogin: {
        summary: 'Login with phone (VN)',
        value: { phone: '0912345678', password: 'P@ssw0rd' },
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login/google')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Đăng nhập với Google',
    description: 'Đăng nhập hoặc đăng ký tài khoản mới bằng Google OAuth. Frontend cần gửi Google ID token sau khi user đăng nhập thành công trên Google.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: { 
      example: { 
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@gmail.com',
          firstName: 'Nguyen',
          lastName: 'Van A',
          avatar: 'https://lh3.googleusercontent.com/...'
        }
      } 
    } 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Xác thực Google thất bại',
  })
  @ApiBody({
    type: GoogleLoginDto,
    examples: {
      googleLogin: {
        summary: 'Login with Google',
        value: { 
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9...' 
        },
      },
    },
  })
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto);
  }

  @Post('login/apple')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Đăng nhập với Apple',
    description: 'Đăng nhập hoặc đăng ký tài khoản mới bằng Apple Sign In. Frontend cần gửi Apple identity token sau khi user đăng nhập thành công trên Apple.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: { 
      example: { 
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@icloud.com',
          firstName: 'Nguyen',
          lastName: 'Van A'
        }
      } 
    } 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Xác thực Apple thất bại',
  })
  @ApiBody({
    type: AppleLoginDto,
    examples: {
      appleLogin: {
        summary: 'Login with Apple',
        value: { 
          identityToken: 'eyJraWQiOiJlWGF1bm1IMiIsImFsZyI6IlJTMjU2In0...',
          user: '001234.567890abcdef.1234',
          email: 'user@icloud.com',
          fullName: 'Nguyen Van A'
        },
      },
    },
  })
  async loginWithApple(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(dto);
  }
}
