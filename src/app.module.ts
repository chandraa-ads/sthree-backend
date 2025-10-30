import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ✅ Feature Modules
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // ✅ Load environment variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ Supabase replaces TypeORM
    SupabaseModule,

    // ✅ App feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    AdminModule,
  ],

  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
