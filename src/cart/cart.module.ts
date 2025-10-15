// src/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart.entity';
import { ProductsModule } from '../products/products.module';
import { CartController } from './cart.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // ✅ Import SupabaseModule

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem]),
    ProductsModule,
    SupabaseModule, // ✅ make SupabaseService available
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
