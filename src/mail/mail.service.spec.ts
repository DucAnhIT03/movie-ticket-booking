import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        MAIL_HOST: 'smtp.gmail.com',
        MAIL_PORT: 587,
        MAIL_SECURE: false,
        MAIL_USER: 'test@gmail.com',
        MAIL_PASS: 'test-password',
        MAIL_FROM: 'noreply@test.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create transporter with correct config', () => {
    expect(configService.get).toHaveBeenCalledWith('MAIL_HOST');
    expect(configService.get).toHaveBeenCalledWith('MAIL_PORT');
    expect(configService.get).toHaveBeenCalledWith('MAIL_USER');
    expect(configService.get).toHaveBeenCalledWith('MAIL_PASS');
  });

  describe('sendMail', () => {
    it('should send email successfully', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
      (service as any).transporter = {
        sendMail: mockSendMail,
      };

      const result = await service.sendMail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });
    });

    it('should handle email sending failure', async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP Error'));
      (service as any).transporter = {
        sendMail: mockSendMail,
      };

      const result = await service.sendMail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result).toBe(false);
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation email', async () => {
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(true);

      const bookingData = {
        userName: 'John Doe',
        bookingId: 'BK001',
        movieTitle: 'Test Movie',
        theaterName: 'Test Theater',
        screenName: 'Screen 1',
        showTime: '2024-01-01 19:00',
        seats: 'A1, A2',
        totalPrice: 200000,
      };

      const result = await service.sendBookingConfirmation('test@example.com', bookingData);

      expect(result).toBe(true);
      expect(sendMailSpy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Xác nhận đặt vé thành công',
        template: 'booking-confirmation',
        context: bookingData,
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue(true);

      const result = await service.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(result).toBe(true);
      expect(sendMailSpy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Chào mừng đến với hệ thống đặt vé',
        template: 'welcome',
        context: { userName: 'John Doe' },
      });
    });
  });
});
