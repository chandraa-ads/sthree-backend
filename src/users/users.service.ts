import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as multer from 'multer';
type File = Express.Multer.File;

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
  const { userId, full_name, phone, whatsapp_no, addresses,dob,gender } = dto;

  if (!userId) throw new InternalServerErrorException('UserId is required');

  const updateData: any = {};
  if (full_name) updateData.full_name = full_name;
  if (phone) updateData.phone = phone;
  if (whatsapp_no) updateData.whatsapp_no = whatsapp_no; 
   if (dob) updateData.dob = dob;              // ✅ added
  if (gender) updateData.gender = gender;

  // Addresses processing as before
  if (addresses) {
    if (typeof addresses === 'string') {
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

  // Upload profile photo as before
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
