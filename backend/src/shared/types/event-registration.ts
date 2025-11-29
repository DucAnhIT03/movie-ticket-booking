export interface EventRegistrationEntity {
  id: number;
  event_id: number;
  full_name: string;
  email: string;
  phone: string;
  note: string | null;
  created_at: Date;
}




