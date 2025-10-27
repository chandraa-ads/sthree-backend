import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductReview } from './entities/product.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { FilterProductsDto } from './dto/filter-products.dto';
export interface ProductVariantImage {
  image_url: string;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  original_price?: number;         // NEW
  discount_percentage?: number;    // NEW
  price?: number;
  stock?: number;
  images: ProductVariantImage[];
  variant_images?: string[]; // add this line
}

export interface ProductResponse {
  id: string;
  name: string;
  brand?: string | null;
  about_item?: string | null;
  product_detail?: string | null;
  images?: string[];          // main product images URLs
  image?: string;             // main product primary image URL (first image)
  variants?: ProductVariant[];// product variants with images etc.
}
export interface ProductImage {
  id: string;
  variant_id: string;
  image_url: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewImagePayload {
  review_id: string;
  image_url: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private readonly productReviewRepository: Repository<ProductReview>,


  ) { }


  private async uploadReviewFile(
    file: Express.Multer.File,
    productId: string,
    reviewId: string,
    index: number
  ): Promise<string> {
    const supabase = this.supabaseService.client;

    const fileExt = file.originalname.split('.').pop();
    const filePath = `review-media/${productId}-${reviewId}-${index}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('products') // ✅ Fixed bucket name
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError)
      throw new InternalServerErrorException(uploadError.message);

    const { data } = supabase.storage.from('products').getPublicUrl(filePath);
    if (!data?.publicUrl)
      throw new InternalServerErrorException('Failed to get public URL');

    return data.publicUrl;
  }

  private async uploadFile(
    file: Express.Multer.File,
    folder: string,
    filename: string,
  ): Promise<string> {
    const supabase = this.supabaseService.client;
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${folder}/${filename}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError)
      throw new InternalServerErrorException(uploadError.message);

    const { data } = supabase.storage.from(folder).getPublicUrl(filePath);
    if (!data?.publicUrl)
      throw new InternalServerErrorException('Failed to get public URL');

    return data.publicUrl;
  }

  async create(
    dto: CreateProductDto,
    files: {
      images?: Express.Multer.File[];
      variant_images_map?: Record<string, Express.Multer.File[]>;
    },
    userId: string,
  ): Promise<{
    message: string;
    product_id: string;
    product: ProductResponse;
  }> {
    const supabase = this.supabaseService.client;

    try {
      // 1️⃣ Handle category
      let categoryId: string | null = null;
      if (dto.category) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', dto.category)
          .maybeSingle();

        if (existingCategory?.id) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCat, error: catErr } = await supabase
            .from('categories')
            .insert([{ name: dto.category }])
            .select('id')
            .single();
          if (catErr) throw new InternalServerErrorException(catErr.message);
          categoryId = newCat.id;
        }
      }

      // 2️⃣ Compute price
      const originalPrice = dto.original_price ?? 0;
      const discountPercentage = dto.discount_percentage ?? 0;
      const finalPrice = Math.round(
        originalPrice - (originalPrice * discountPercentage) / 100,
      );

      // 3️⃣ Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          {
            name: dto.name,
            price: finalPrice,
            original_price: originalPrice,
            discount_percentage: discountPercentage,
            stock: dto.stock ?? null,
            main_category: dto.main_category ?? null,
            sub_category: dto.sub_category ?? null,
            brand: dto.brand ?? null,
            about_item: dto.about_item ?? null,
            product_detail: dto.product_detail ?? null,
            description: dto.description ?? null,
            discount_start_date: dto.discount_start_date ?? null,
            discount_end_date: dto.discount_end_date ?? null,
            product_size: dto.product_size ?? null,
            published_at: dto.published_at ?? new Date().toISOString(),
            archived_at: dto.archived_at ?? null,
            category_id: categoryId,
            tags: Array.isArray(dto.tags)
              ? dto.tags
              : typeof dto.tags === 'string'
                ? dto.tags.split(',').map((t) => t.trim())
                : null,
            created_by: userId,
            updated_by: userId,
          },
        ])
        .select()
        .single();

      if (productError || !product)
        throw new InternalServerErrorException(
          productError?.message || 'Product creation failed',
        );

      // 4️⃣ Upload product images
      let imageUrls: string[] = [];
      if (files.images && files.images.length > 0) {
        const uploads = files.images.map((file, i) =>
          this.uploadFile(file, 'products', `${product.id}-${i}`),
        );
        imageUrls = await Promise.all(uploads);

        const { error: imgErr } = await supabase
          .from('products')
          .update({ images: imageUrls })
          .eq('id', product.id);
        if (imgErr) throw new InternalServerErrorException(imgErr.message);
      }

      // 5️⃣ Handle variants
      const variants: ProductVariant[] = [];
      const variantArray = Array.isArray(dto.variants)
        ? dto.variants
        : dto.variants
          ? [dto.variants]
          : [];

      if (variantArray.length > 0) {
        const { data: insertedVariants, error: varErr } = await supabase
          .from('product_variants')
          .insert(
            variantArray.map((v) => {
              const originalPrice = v.original_price ?? 0;
              const discountPercentage = v.discount_percentage ?? 0;
              const price =
                Math.round(originalPrice - (originalPrice * discountPercentage) / 100) || null;

              return {
                product_id: product.id,
                color: v.color ?? null,
                size: v.size ?? null,
                original_price: originalPrice,
                discount_percentage: discountPercentage,
                price: price,
                stock: v.stock ?? null,
                created_by: userId,
                updated_by: userId,
              };
            }),
          )
          .select();

        if (varErr) throw new InternalServerErrorException(varErr.message);

        // Upload variant images
        if (files.variant_images_map) {
          for (const variant of insertedVariants) {
            const varFiles = files.variant_images_map[variant.id] || [];
            for (let j = 0; j < varFiles.length; j++) {
              const imageUrl = await this.uploadFile(
                varFiles[j],
                'variant_images',
                `${variant.id}-${j}`,
              );
              const { error: imgErr } = await supabase
                .from('product_images')
                .insert({
                  variant_id: variant.id,
                  image_url: imageUrl,
                  is_primary: j === 0,
                });
              if (imgErr) console.error('Variant image insert error:', imgErr);
            }
          }
        }

        // Attach images to variants
        for (const v of insertedVariants) {
          const { data: imgs } = await supabase
            .from('product_images')
            .select('*')
            .eq('variant_id', v.id);

          v.images = imgs || [];
          v.variant_images = imgs?.map((i) => i.image_url) || [];
        }

        variants.push(...insertedVariants);
      }

      // 6️⃣ Build product response
      const productResponse: any = {
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        discount_percentage: product.discount_percentage,
        stock: product.stock,
        category: dto.category ?? null,
        main_category: product.main_category,
        sub_category: product.sub_category,
        brand: product.brand,
        about_item: product.about_item,
        product_detail: product.product_detail,
        description: product.description,
        product_size: product.product_size,
        discount_start_date: product.discount_start_date,
        discount_end_date: product.discount_end_date,
        tags: product.tags,
        variants,
      };

      if (imageUrls.length || (product.images && product.images.length)) {
        productResponse.images = imageUrls.length
          ? imageUrls
          : product.images;
        productResponse.image = imageUrls.length
          ? imageUrls[0]
          : product.images?.[0];
      }

      // 7️⃣ Return
      return {
        message: 'Product created successfully',
        product_id: product.id,
        product: productResponse,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Create product error:', errorMessage);
      throw new InternalServerErrorException(
        errorMessage || 'Failed to create product',
      );
    }
  }




  async update(
    id: string,
    dto: UpdateProductDto,
    files: { images?: Express.Multer.File[] },
    userId: string,
  ) {
    const supabase = this.supabaseService.client;

    try {
      // 1️⃣ Recalculate product price
      const originalPrice = dto.original_price ?? null;
      const discountPercentage = dto.discount_percentage ?? null;
      let calculatedPrice: number | null = null;

      if (originalPrice !== null && discountPercentage !== null) {
        calculatedPrice = Math.round(
          originalPrice - (originalPrice * discountPercentage) / 100,
        );
      }

      // 2️⃣ Update product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          ...dto,
          price: calculatedPrice ?? dto.price,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError)
        throw new InternalServerErrorException(updateError.message);

      if (!updatedProduct)
        throw new NotFoundException(`Product with id ${id} not found`);

      // 3️⃣ Upload product images
      let imageUrls: string[] = [];
      if (files.images?.length) {
        const uploadPromises = files.images.map((file, index) =>
          this.uploadFile(file, 'products', `${id}-${index}`),
        );
        imageUrls = await Promise.all(uploadPromises);

        const { error: imgErr } = await supabase
          .from('products')
          .update({ images: imageUrls })
          .eq('id', id);
        if (imgErr)
          throw new InternalServerErrorException(imgErr.message);

        updatedProduct.images = imageUrls;
        updatedProduct.image = imageUrls[0];
      }

      // 4️⃣ Update variants with price calculations
      if (dto.variants && Array.isArray(dto.variants)) {
        for (const v of dto.variants) {
          const vOriginalPrice = v.original_price ?? 0;
          const vDiscountPercentage = v.discount_percentage ?? 0;
          const vPrice =
            Math.round(vOriginalPrice - (vOriginalPrice * vDiscountPercentage) / 100) || null;

          await supabase
            .from('product_variants')
            .update({
              original_price: vOriginalPrice,
              discount_percentage: vDiscountPercentage,
              price: vPrice,
              color: v.color ?? null,
              size: v.size ?? null,
              stock: v.stock ?? null,
              updated_at: new Date().toISOString(),
              updated_by: userId,
            })
            .eq('id', v.id);
        }
      }

      // 5️⃣ Fetch updated variants
      const { data: variantsData, error: variantError } = await supabase
        .from('product_variants')
        .select('*, product_images(image_url)')
        .eq('product_id', id);

      if (variantError)
        throw new InternalServerErrorException(variantError.message);

      const variants =
        variantsData?.map((variant) => ({
          id: variant.id,
          color: variant.color,
          size: variant.size,
          original_price: variant.original_price,
          discount_percentage: variant.discount_percentage,
          price: variant.price,
          stock: variant.stock,
          variant_images: variant.product_images?.map(
            (img: any) => img.image_url,
          ) || [],
        })) || [];

      // 6️⃣ Fetch category
      let categoryName: string | null = null;
      if (updatedProduct.category_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('name')
          .eq('id', updatedProduct.category_id)
          .single();
        categoryName = category?.name ?? null;
      }

      // 7️⃣ Build response
      const productResponse: any = {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        original_price: updatedProduct.original_price,
        discount_percentage: updatedProduct.discount_percentage,
        stock: updatedProduct.stock,
        category: categoryName,
        main_category: updatedProduct.main_category,
        sub_category: updatedProduct.sub_category,
        brand: updatedProduct.brand,
        about_item: updatedProduct.about_item,
        product_detail: updatedProduct.product_detail,
        description: updatedProduct.description,
        product_size: updatedProduct.product_size,
        discount_start_date: updatedProduct.discount_start_date,
        discount_end_date: updatedProduct.discount_end_date,
        tags: updatedProduct.tags,
        created_at: updatedProduct.created_at,
        updated_at: updatedProduct.updated_at,
        variants,
      };

      if (updatedProduct.images?.length || imageUrls.length) {
        productResponse.images =
          imageUrls.length > 0 ? imageUrls : updatedProduct.images;
        productResponse.image =
          imageUrls.length > 0
            ? imageUrls[0]
            : updatedProduct.images?.[0] || null;
      }

      return {
        message: 'Product updated successfully',
        product_id: updatedProduct.id,
        product: productResponse,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Product update error:', errorMessage);
      throw new InternalServerErrorException(
        errorMessage || 'Failed to update product',
      );
    }
  }


  // Remove product by id
  async remove(id: string) {
    const { error } = await this.supabaseService.client
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Product deleted' };
  }

  // Find all products with filters and sorting
  async findAll(query: any) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.images', 'variant_images')
      .leftJoinAndSelect('product.product_images', 'product_images')
      .leftJoinAndSelect('product.category_relation', 'category');

    // Filters
    if (query.sub_category) {
      qb.andWhere('product.sub_category = :sub_category', {
        sub_category: query.sub_category,
      });
    }
    if (query.category) {
      qb.andWhere('product.category_id = :category', {
        category: query.category,
      });
    }
    if (query.brand) {
      qb.andWhere('product.brand = :brand', { brand: query.brand });
    }
    if (query.minPrice) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    // Sorting
    if (query.sortBy) {
      const order = query.order === 'asc' ? 'ASC' : 'DESC';
      qb.orderBy(`product.${query.sortBy}`, order);
    } else {
      // Default ordering
      qb.orderBy('product.created_at', 'DESC');
    }

    // Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
    };
  }

  // Find single product by id
  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'product_images',
        'category_relation',
        'created_by_user',
        'updated_by_user',
        'reviews',
      ],
    });

    if (!product) throw new NotFoundException('Product not found');

    const { data: variants, error } = await this.supabaseService.client
      .from('product_variants')
      .select('*, product_images(image_url)')
      .eq('product_id', id);

    if (error) {
      console.error('Error loading variants:', error);
      throw new InternalServerErrorException('Failed to load product variants');
    }

    product.variants = variants || [];
    return product;
  }


  private getMediaType(mimetype: string): 'image' | 'video' | 'gif' {
    if (mimetype.startsWith('image/gif')) return 'gif';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'image'; // fallback
  }



async toggleWishlist(body: { user_id: string; product_id: string }) {
  const { user_id, product_id } = body;
  const supabase = this.supabaseService.client;
  const timestamp = new Date().toISOString();

  // 1️⃣ Check if wishlist entry exists
  const { data: existing, error: selectError } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', user_id)
    .eq('product_id', product_id)
    .maybeSingle();

  if (selectError) throw new InternalServerErrorException(selectError.message);

  let wishlistStatus: boolean;

  if (existing) {
    // ❌ Remove from wishlist table
    const { error: deleteError } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', existing.id);

    if (deleteError) throw new InternalServerErrorException(deleteError.message);

    wishlistStatus = false;
  } else {
    // ✅ Add to wishlist table
    const { error: insertError } = await supabase
      .from('wishlist')
      .insert({
        user_id,
        product_id,
        created_at: timestamp,
        updated_at: timestamp,
      });

    if (insertError) throw new InternalServerErrorException(insertError.message);

    wishlistStatus = true;
  }

  // 2️⃣ Update the `wishlist` column in the products table
  const { error: updateError } = await supabase
    .from('products')
    .update({ wishlist: wishlistStatus, updated_at: timestamp })
    .eq('id', product_id);

  if (updateError) throw new InternalServerErrorException(updateError.message);

  return {
    message: wishlistStatus ? 'Added to wishlist' : 'Removed from wishlist',
    wishlist: wishlistStatus,
    product_id,
  };
}






async getWishlistByUser(
  userId: string,
  page?: number,
  limit?: number,
) {
  const supabase = this.supabaseService.client;

  const currentPage = page && page > 0 ? page : 1;
  const currentLimit = limit && limit > 0 ? limit : 10;
  const offset = (currentPage - 1) * currentLimit;

  const { data, count, error } = await supabase
    .from('wishlist')
    .select(`
      id,
      product_id,
      created_at,
      updated_at,
      product:products(*)  -- fetch product details
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + currentLimit - 1);

  if (error) throw new InternalServerErrorException(error.message);

  return {
    total: count || 0,
    page: currentPage,
    limit: currentLimit,
    data: data || [],
  };
}






  // Add a review with optional images
  // src/products/products.service.ts
  // Add a review with optional images


  async addReview(
    reviewData: { user_id: string; product_id: string; rating: number; comment: string },
    files: Express.Multer.File[],
  ) {
    const { user_id, product_id, rating, comment } = reviewData;

    try {
      // 1️⃣ Insert review without media first
      const reviewInsert = await this.productReviewRepository.insert({
        user_id,
        product_id,
        rating,
        comment,
        media: [],
      });

      const reviewId = reviewInsert.identifiers[0].id;

      // 2️⃣ Handle media uploads
      const mediaArray: { type: 'image' | 'video' | 'gif'; url: string }[] = [];

      if (files.length > 0) {
        const urls = await Promise.all(
          files.map((file, index) =>
            this.uploadFile(file, 'products', `${product_id}-${reviewId}-${index}`),
          ),
        );

        urls.forEach((url, idx) => {
          const mimetype = files[idx].mimetype;
          mediaArray.push({
            type: this.getMediaType(mimetype),
            url,
          });
        });

        // Update review with media
        await this.productReviewRepository.update(reviewId, { media: mediaArray });
      }

      // 3️⃣ Recalculate average rating
      const avgData = await this.productReviewRepository
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .where('r.product_id = :product_id', { product_id })
        .getRawOne();

      const avgRating = parseFloat(avgData.avg) || 0;

      // 4️⃣ Update product with new average
      await this.productRepository.update(product_id, { average_rating: avgRating });

      // 5️⃣ Fetch review with user info
      const review = await this.productReviewRepository.findOne({
        where: { id: reviewId },
        relations: ['user'],
      });

      if (!review) {
        throw new InternalServerErrorException('Failed to retrieve review after creation');
      }

      // 6️⃣ Return response including user info
      return {
        message: 'Review added successfully',
        review: {
          id: review.id,
          user_id: review.user_id,
          product_id: review.product_id,
          rating: review.rating,
          comment: review.comment,
          media: Array.isArray(review.media) ? review.media : [],
          created_at: review.created_at,
          updated_at: review.updated_at,
          user: review.user
            ? {
              id: review.user.id,
              name: review.user.username || review.user.email || 'Unknown',
            }
            : { id: null, name: 'Unknown' },
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error adding review:', errorMessage);
      throw new InternalServerErrorException(errorMessage  || 'Failed to add review');
    }
  }



  // Get all reviews for a product
  async getReviewsByProduct(product_id: string) {
    try {
      const reviews = await this.productReviewRepository.find({
        where: { product_id },
        relations: ['user'], // eager-load user info
        order: { created_at: 'DESC' },
      });

      // Map reviews to a clean response structure
      return reviews.map((review) => ({
        id: review.id,
        user_id: review.user_id,
        product_id: review.product_id,
        rating: review.rating,
        comment: review.comment,
        media: Array.isArray(review.media) ? review.media : [],
        created_at: review.created_at,
        updated_at: review.updated_at,
        user: review.user
          ? {
            id: review.user.id,
            name: review.user.username || review.user.email || 'Unknown',
          }
          : { id: null, name: 'Unknown' },
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching reviews:', errorMessage);
      throw new InternalServerErrorException(errorMessage  || 'Failed to fetch reviews');
    }
  }




  // Get average rating and count for a product
  async getAverageRating(product_id: string) {
    try {
      const avgData = await this.productReviewRepository
        .createQueryBuilder('r')
        .select('AVG(r.rating)', 'avg')
        .addSelect('COUNT(r.id)', 'count')
        .where('r.product_id = :product_id', { product_id })
        .getRawOne();

      return {
        average: parseFloat(avgData.avg) || 0,
        count: parseInt(avgData.count, 10) || 0,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error getting average rating:', errorMessage);
      throw new InternalServerErrorException(errorMessage  || 'Failed to calculate average rating');
    }
  }


  async exportProductsToExcel(res: Response) {
    // Fetch products with variants and images
    const products = await this.findAll({ limit: 1000 }); // Adjust limit as needed

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Variants', key: 'variants', width: 50 },
      { header: 'Images', key: 'images', width: 50 },
    ];

    // Add rows
    products.data.forEach((product) => {
      // Flatten variants info as a string
      const variantsStr = product.variants
        .map(
          (v) =>
            `Color: ${v.color || 'N/A'}, Size: ${v.size || 'N/A'}, Price: ${v.price ?? 'N/A'
            }, Stock: ${v.stock ?? 'N/A'}`,
        )
        .join('; ');

      // Join images URLs
      const imagesStr = product.images?.join('; ') || '';

      worksheet.addRow({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price ?? '',
        stock: product.stock ?? '',
        variants: variantsStr,
        images: imagesStr,
      });
    });

    // Set headers for download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

    // Write the file to the response stream
    await workbook.xlsx.write(res);
    res.end();
  }


async filterProducts(filterDto: FilterProductsDto) {
  const {
    category,
    main_category,
    sub_category,
    brand,
    minPrice,
    maxPrice,
    rating,
    name,
    limit = 10,
    page = 1,
  } = filterDto;

  const skip = (page - 1) * limit;

  const query = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.variants', 'variant')
    .leftJoinAndSelect('product.reviews', 'review')
    .leftJoinAndSelect('product.category_relation', 'category');

  // Filters
  if (category) query.andWhere('product.category = :category', { category });
  if (main_category)
    query.andWhere('product.main_category = :main_category', { main_category });
  if (sub_category)
    query.andWhere('product.sub_category = :sub_category', { sub_category });
  if (brand) query.andWhere('product.brand = :brand', { brand });
  if (minPrice) query.andWhere('product.price >= :minPrice', { minPrice });
  if (maxPrice) query.andWhere('product.price <= :maxPrice', { maxPrice });

  // ✅ Search across multiple fields
  if (name) {
    query.andWhere(
      `(product.name ILIKE :name OR product.brand ILIKE :name OR product.main_category ILIKE :name OR product.sub_category ILIKE :name)`,
      { name: `%${name}%` },
    );
  }

  query.andWhere('product.is_deleted = false');

  // Add average rating as a subquery
  query.addSelect((subQuery) => {
    return subQuery
      .select('COALESCE(AVG(review.rating), 0)', 'avg_rating')
      .from(ProductReview, 'review')
      .where('review.product_id = product.id');
  }, 'average_rating');

  if (rating) {
    query.andWhere(
      (qb) =>
        `${qb
          .subQuery()
          .select('AVG(review.rating)')
          .from(ProductReview, 'review')
          .where('review.product_id = product.id')
          .getQuery()} >= :rating`,
      { rating },
    );
  }

  query.skip(skip).take(limit);

  const [products, total] = await query.getManyAndCount();

  return {
    total,
    page,
    limit,
    data: products.map((p) => ({
      ...p,
      average_rating:
        p['average_rating'] !== undefined ? Number(p['average_rating']) : 0,
    })),
  };
}


  async findByCategory(mainCategory: string) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.images', 'variant_images')
      .leftJoinAndSelect('product.product_images', 'product_images')
      .leftJoinAndSelect('product.category_relation', 'category')
      // 🔍 Partial search on main_category (case-insensitive)
      .where('LOWER(product.main_category) LIKE LOWER(:mainCategory)', {
        mainCategory: `%${mainCategory}%`,
      })
      .orderBy('product.created_at', 'DESC')
      .getMany();

    if (!products.length) {
      throw new NotFoundException(
        `No products found under category matching "${mainCategory}"`
      );
    }

    return {
      count: products.length,
      products,
    };
  }


}
