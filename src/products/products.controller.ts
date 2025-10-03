import { Controller, Post, Patch, Get, Param, Body, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ================= Admin: Products =================
  @Post('admin/products')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  @ApiBody({ type: CreateProductDto })
  async create(@Body() dto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.create(dto, file);
  }

  @Patch('admin/products/:id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { storage: multer.memoryStorage() }))
  @ApiBody({ type: UpdateProductDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.productsService.update(id, dto, file);
  }

  @Get('admin/products')
  async findAll(@Query() filters: any) {
    return this.productsService.findAll(filters);
  }

  @Get('admin/products/:id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ================= User: Reviews =================
  @Post('products/review')
  @ApiOperation({ summary: 'Add a review for a product' })
  async addReview(@Body() dto: CreateReviewDto) {
    return this.productsService.addReview(dto);
  }

  @Get('products/:id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  async getReviews(@Param('id') id: string) {
    return this.productsService.getReviewsByProduct(id);
  }

  @Get('products/:id/reviews/average')
  @ApiOperation({ summary: 'Get average rating for a product' })
  async getAverageRating(@Param('id') id: string) {
    return this.productsService.getAverageRating(id);
  }
}
