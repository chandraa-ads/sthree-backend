import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabase } from '../config/database.config';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';

export interface VariantImage {
  variant_id: string;
  image_url: string;
  is_primary: boolean;
}

@Injectable()
export class ProductVariantsService {
  private readonly bucketName = 'products'; // your Supabase bucket name

  private async uploadFile(
    file: Express.Multer.File,
    bucketName: string = 'products',
    filename: string,
  ): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${filename}.${fileExt}`; // no folder prefix unless you want one

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // optionally replace existing file
      });

    if (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException(error.message);
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (!data?.publicUrl)
      throw new InternalServerErrorException('Failed to get public URL');

    return data.publicUrl;
  }

  async create(
    dto: CreateVariantDto,
    files: Express.Multer.File[],
    userId: string,
  ) {
    try {
      // 1. Insert variant row
      const { data: variant, error: insertError } = await supabase
        .from('product_variants')
        .insert([
          {
            product_id: dto.product_id,
            color: dto.color ?? null,
            size: dto.size ?? null,
            price: dto.price ?? null,
            stock: dto.stock ?? null,
            created_by: userId,
            updated_by: userId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw new InternalServerErrorException(
          insertError.message || 'Variant creation failed',
        );
      }
      if (!variant) {
        throw new InternalServerErrorException('Variant creation failed');
      }

      // 2. Upload variant images to the 'products/variants' folder
      const images: VariantImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const publicUrl = await this.uploadFile(
          files[i],
          'products', // folder inside bucket
          `${variant.id}-${Date.now()}-${i}`, // unique filename
        );

        images.push({
          variant_id: variant.id,
          image_url: publicUrl,
          is_primary: i === 0,
        });
      }

      // 3. Insert images into product_images table if images exist
      if (images.length > 0) {
        const { error: imageInsertError } = await supabase
          .from('product_images')
          .insert(images);
        if (imageInsertError) {
          throw new InternalServerErrorException(
            imageInsertError.message || 'Failed to save variant images',
          );
        }
      }

      // 4. Return response with variant and images
      return {
        message: 'Variant created successfully',
        variant,
        images,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to create variant',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateVariantDto,
    files: Express.Multer.File[],
    userId: string,
  ) {
    try {
      // 1. Update variant data
      const { data: updated, error: updateError } = await supabase
        .from('product_variants')
        .update({
          ...dto,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updated) {
        throw new InternalServerErrorException(
          updateError?.message || 'Variant update failed',
        );
      }

      // 2. If files uploaded, upload and save images
      if (files.length > 0) {
        const images: VariantImage[] = [];
        for (let i = 0; i < files.length; i++) {
          const publicUrl = await this.uploadFile(
            files[i],
            'variants',
            `${id}-${Date.now()}-${i}`,
          );
          images.push({
            variant_id: id,
            image_url: publicUrl,
            is_primary: i === 0,
          });
        }
        if (images.length) {
          const { error: insertError } = await supabase
            .from('product_images')
            .insert(images);
          if (insertError) {
            throw new InternalServerErrorException(
              insertError.message || 'Failed to save updated variant images',
            );
          }
        }
      }

      return { message: 'Variant updated successfully', variant: updated };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update variant',
      );
    }
  }

  async getVariantsByProduct(productId: string) {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getVariant(id: string) {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Variant not found');
    return data;
  }

  async remove(id: string, userId: string) {
    // Optionally: delete variant images from storage and DB first (not implemented here)

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Variant deleted successfully' };
  }
}
