// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ApiConsumes, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/utils/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/utils/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { FilterProductsDto } from './dto/filter-products.dto';

@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  // Create Product with images and variants
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'variant_images', maxCount: 50 },
    ]),
  )
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      variant_images?: Express.Multer.File[];
    },
    @Req() req,
  ) {
    if (dto.variants && typeof dto.variants === 'string') {
      try {
        dto.variants = JSON.parse(dto.variants);
      } catch (err) {
        throw new BadRequestException('Invalid JSON format for variants');
      }
    }

    const variant_images_map: Record<number, Express.Multer.File[]> = {};
    if (files.variant_images && files.variant_images.length) {
      for (const file of files.variant_images) {
        const field = (file as any).fieldname;
        const match = field.match(/^variants\[(\d+)\]\.variant_images$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          if (!variant_images_map[idx]) variant_images_map[idx] = [];
          variant_images_map[idx].push(file);
        }
      }
    }

    return await this.productsService.create(
      dto,
      {
        images: files.images || [],
        variant_images_map,
      },
      req.user.id,
    );
  }

  // Update Product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'variant_images', maxCount: 20 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req,
  ) {
    if (dto.variants && typeof dto.variants === 'string') {
      try {
        dto.variants = JSON.parse(dto.variants);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for variants');
      }
    }

    return this.productsService.update(
      id,
      dto,
      { images: files.images || [] },
      req.user.id,
    );
  }

  // Get All Products
  @Get()
  async findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  // Search by category
  @Get('search/by-category')
  async findByCategory(@Query('main_category') mainCategory: string) {
    if (!mainCategory || !mainCategory.trim()) {
      throw new BadRequestException('Main category is required');
    }
    return this.productsService.findByCategory(mainCategory.trim());
  }

  // Delete Product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }


  // ✅ Toggle wishlist automatically (no body needed)
  @Patch(':id/wishlist')
  @UseGuards(JwtAuthGuard)
  async toggleWishlist(@Param('id') product_id: string, @Req() req) {
    // Pass user_id and product_id to service
    return this.productsService.toggleWishlist({
      user_id: req.user.id,
      product_id,
    });
  }



  @Get('user/:user_id/wishlist')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserWishlist(
    @Param('user_id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!userId) throw new BadRequestException('User ID is required');

    return this.productsService.getWishlistByUser(userId, page, limit);
  }



  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  async addReview(
    @Param('id') product_id: string,
    @Body() dto: CreateReviewDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Req() req,
  ) {
    if (!dto.comment || !dto.rating) {
      throw new BadRequestException('Comment and rating are required');
    }

    const reviewData = {
      product_id,
      user_id: req.user.id,
      rating: dto.rating,
      comment: dto.comment,
    };

    return this.productsService.addReview(reviewData, files.images || []);
  }

  @Get(':id/reviews')
  async getReviewsByProduct(@Param('id') product_id: string) {
    return this.productsService.getReviewsByProduct(product_id);
  }

  @Get(':productId/average-rating')
  async getAverageRating(@Param('productId') productId: string) {
    return this.productsService.getAverageRating(productId);
  }

  // Export products to Excel
  @Get('export/excel')
  async exportProductsExcel(@Res() res: Response) {
    return this.productsService.exportProductsToExcel(res);
  }

  // Filter products
  @Get('filter')
  async filterProducts(@Query() filters: FilterProductsDto) {
    if (filters.name) filters.name = filters.name.trim();
    return this.productsService.filterProducts(filters);
  }


  // Get single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
