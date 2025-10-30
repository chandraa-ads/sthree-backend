import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule, // ✅ Use Supabase for all DB operations
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
