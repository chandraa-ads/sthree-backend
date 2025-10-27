export class UserEntity {
  id: string;
  email: string;
  username: string;
  password: string;
  role: string;
  email_verified: boolean;

  profile_photo?: string;
  full_name?: string;
  phone?: string;
  whatsapp_no?: string;       // added
  address?: string[];         // updated to array

  dob?: string;           // ISO format (YYYY-MM-DD)
  gender?: string;
  created_at?: Date;       // when user was created
  updated_at?: Date;       // last update timestamp
  last_login?: Date;       // last login timestamp
  is_active?: boolean;     // account active status
}
