export class UserResponseDto {
  id: string;
  username: string;
  role: string;
  email_verified: boolean;

  profile_photo?: string;
  full_name?: string;
  phone?: string;
  whatsapp_no?: string;       // added
  address?: string[];         // updated to array
  dob?: string;
  gender?: string;
}
