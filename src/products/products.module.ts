// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';            // <-- Import TypeOrmModule
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { Product, ProductReview } from './entities/product.entity';        // <-- Import Product entity
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    SupabaseModule, 
    TypeOrmModule.forFeature([Product,ProductReview]),     
    UsersModule                // <-- Register Product repository here
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService,TypeOrmModule],
})
export class ProductsModule {}
