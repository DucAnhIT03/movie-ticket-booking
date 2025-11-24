export interface EmailLogEntity {
  id: number;
  to: string;
  subject: string;
  type: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
  messageId: string | null;
  sentAt: Date;
  metadata: Record<string, any> | null;
}


