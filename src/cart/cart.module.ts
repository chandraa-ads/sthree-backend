import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from '../products/products.module';
import { SupabaseModule } from '../supabase/supabase.module'; // ✅ Supabase for DB

@Module({
  imports: [
    ProductsModule,
    SupabaseModule, // ✅ makes SupabaseService available app-wide
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
