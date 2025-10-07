import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let mockEmailQueue: any;

  beforeEach(async () => {
    mockEmailQueue = {
      add: jest.fn(),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      empty: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('email'),
          useValue: mockEmailQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addEmailJob', () => {
    it('should add email job to queue', async () => {
      const emailData = {
        type: 'booking-confirmation' as const,
        to: 'test@example.com',
        data: { userName: 'John Doe' },
      };

      await service.addEmailJob(emailData);

      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-email', emailData, {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    });

    it('should add email job with delay', async () => {
      const emailData = {
        type: 'booking-reminder' as const,
        to: 'test@example.com',
        data: { userName: 'John Doe' },
      };
      const delay = 5000;

      await service.addEmailJob(emailData, delay);

      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-email', emailData, {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        delay: 5000,
      });
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation email', async () => {
      const addEmailJobSpy = jest.spyOn(service, 'addEmailJob').mockResolvedValue();

      await service.sendBookingConfirmation('test@example.com', { userName: 'John Doe' });

      expect(addEmailJobSpy).toHaveBeenCalledWith({
        type: 'booking-confirmation',
        to: 'test@example.com',
        data: { userName: 'John Doe' },
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const addEmailJobSpy = jest.spyOn(service, 'addEmailJob').mockResolvedValue();

      await service.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(addEmailJobSpy).toHaveBeenCalledWith({
        type: 'welcome',
        to: 'test@example.com',
        data: { userName: 'John Doe' },
      });
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockEmailQueue.getWaiting.mockResolvedValue([{}, {}]);
      mockEmailQueue.getActive.mockResolvedValue([{}]);
      mockEmailQueue.getCompleted.mockResolvedValue([{}, {}, {}]);
      mockEmailQueue.getFailed.mockResolvedValue([{}]);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 2,
        active: 1,
        completed: 3,
        failed: 1,
      });
    });
  });

  describe('clearQueue', () => {
    it('should clear the queue', async () => {
      await service.clearQueue();

      expect(mockEmailQueue.empty).toHaveBeenCalled();
    });
  });

  describe('pauseQueue', () => {
    it('should pause the queue', async () => {
      await service.pauseQueue();

      expect(mockEmailQueue.pause).toHaveBeenCalled();
    });
  });

  describe('resumeQueue', () => {
    it('should resume the queue', async () => {
      await service.resumeQueue();

      expect(mockEmailQueue.resume).toHaveBeenCalled();
    });
  });
});
