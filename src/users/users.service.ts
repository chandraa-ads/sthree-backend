import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { File } from 'multer';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async getUserById(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('User not found');
    return data;
  }

async updateProfile(profile_photo: File, dto: UpdateProfileDto) {
  const { userId, full_name, phone, addresses } = dto;

  if (!userId) throw new InternalServerErrorException('UserId is required');

  const updateData: any = {};
  if (full_name) updateData.full_name = full_name;
  if (phone) updateData.phone = phone;

  // ✅ Save addresses directly as JSON for jsonb column
if (addresses) {
  if (typeof addresses === 'string') {
    // Typecast to string so TS knows we can use string methods
    const addrStr = addresses as string;
    updateData.address = addrStr.includes(',')
      ? addrStr.split(',').map(addr => addr.trim())
      : [addrStr];
  } else if (Array.isArray(addresses)) {
    updateData.address = addresses;
  } else {
    throw new InternalServerErrorException('Invalid address format');
  }
}



  // Upload profile photo to Supabase using service role
  if (profile_photo) {
    try {
      const filePath = `products/${Date.now()}-${profile_photo.originalname}`;
      const { error: uploadError } = await this.supabaseService.client
        .storage
        .from('products')
        .upload(filePath, profile_photo.buffer, { contentType: profile_photo.mimetype });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = this.supabaseService.client
        .storage
        .from('products')
        .getPublicUrl(filePath);

      updateData.profile_photo = publicUrl.publicUrl;
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload profile photo');
    }
  }

  const { data, error } = await this.supabaseService.client
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new InternalServerErrorException(error.message);

  return { message: 'Profile updated successfully', profile: data };
}


}
