import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { supabase } from '../config/database.config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { File } from 'multer';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ProductsService {
async create(dto: CreateProductDto, file?: File) {
  let imageUrl: string | null = null;

  if (file) {
    const filePath = `products/${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file.buffer, { contentType: file.mimetype });
    if (uploadError) throw new InternalServerErrorException(uploadError.message);

    const { data: publicUrl } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
    imageUrl = publicUrl.publicUrl;
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: dto.name,
      price: dto.price,
      stock: dto.stock,
      main_category: dto.main_category,
      sub_category: dto.sub_category,
      brand: dto.brand,
      product_size: dto.product_size,
      product_detail: dto.product_detail,
      about_item: dto.about_item,
      customer_review: [], // start empty
      image: imageUrl,
    }])
    .select()
    .single();

  if (error) throw new InternalServerErrorException(error.message);

  return { message: 'Product added successfully', product: data };
}


  async update(id: string, dto: UpdateProductDto, file?: File) {
    const updatePayload: any = { ...dto };

    if (dto.price || dto.discount) {
      const discount = dto.discount || 0;
      updatePayload.final_price = dto.price
        ? dto.price - (dto.price * discount) / 100
        : undefined;
    }

    if (file) {
      const filePath = `products/${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file.buffer, { contentType: file.mimetype });
      if (uploadError) throw new InternalServerErrorException(uploadError.message);

      const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(filePath);
      updatePayload.image = publicUrl.publicUrl;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException(error.message);
    return { message: 'Product updated', product: data };
  }

  async findAll(filters?: any) {
    let query = supabase.from('products').select('*');

    if (filters) {
      if (filters.name) query = query.ilike('name', `%${filters.name}%`);
      if (filters.main_category) query = query.eq('main_category', filters.main_category);
      if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
      if (filters.brand) query = query.eq('brand', filters.brand);
      if (filters.size) query = query.eq('product_size', filters.size);
      if (filters.price_min) query = query.gte('price', filters.price_min);
      if (filters.price_max) query = query.lte('price', filters.price_max);
      if (filters.best_selling) query = query.order('final_price', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Product not found');
    return data;
  }

  // ✅ Add a new review, sync with product.customer_review JSONB
// ProductsService.ts
// ✅ Add a new review, also sync with product.customer_review JSONB
async addReview(dto: CreateReviewDto) {
  const { user_id, product_id, rating, comment } = dto;

  // ✅ Check if product exists and fetch current reviews
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, customer_review')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    throw new NotFoundException('Product not found');
  }

  // ✅ Insert review into reviews table
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert([{ user_id, product_id, rating, comment }])
    .select()
    .single();

  if (reviewError) throw new InternalServerErrorException(reviewError.message);

  // ✅ Update product.customer_review array
  const existingReviews = product.customer_review || [];
  const updatedReviews = [
    ...existingReviews,
    {
      user_id,
      rating,
      comment,
      created_at: new Date().toISOString(),
    },
  ];

  const { error: updateError } = await supabase
    .from('products')
    .update({ customer_review: updatedReviews })
    .eq('id', product_id);

  if (updateError) throw new InternalServerErrorException(updateError.message);

  return { message: 'Review added successfully', review };
}


  // Get all reviews for a product
  async getReviewsByProduct(product_id: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('user_id, rating, comment, created_at')
      .eq('product_id', product_id);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // Get average rating for a product
  async getAverageRating(product_id: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating', { count: 'exact' })
      .eq('product_id', product_id);

    if (error) throw new InternalServerErrorException(error.message);

    if (!data || data.length === 0) return { average: 0, count: 0 };

    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / data.length, count: data.length };
  }
}
