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
  address?: string;
}
