export interface EventEntity {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  image: string | null;
  location: string | null;
  start_time: Date;
  end_time: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  is_special: boolean;
  registrations_count?: number;
  created_at: Date;
  updated_at: Date | null;
}



