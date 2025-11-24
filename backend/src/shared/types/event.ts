export interface EventEntity {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  location: string | null;
  start_time: Date;
  end_time: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date | null;
}


