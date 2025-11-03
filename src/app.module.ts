// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

// ✅ Import your entities
import { User } from './products/entities/product.entity';
import { Category, Product, ProductVariant, ProductImage, ProductReview } from './products/entities/product.entity';
import { CartItem } from './cart/entities/cart.entity';
import { CartModule } from './cart/cart.module';
import { Order } from './orders/entities/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '5432', 10),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        // ✅ Add all your entities here
        entities: [
          User,
          Category,
          Product,
          ProductVariant,
          ProductImage,
          ProductReview,
          CartItem,
          Order,
        ],
        synchronize: config.get('NODE_ENV') !== 'production', // auto sync in dev
        ssl: { rejectUnauthorized: false }, // ✅ for Supabase
      }),
    }),

    UsersModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    AdminModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
