// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import dns from 'dns';

// ✅ Force IPv4 first (important for Render/Supabase)
dns.setDefaultResultOrder('ipv4first');

// ✅ Import all entities explicitly
import {
  User,
  Product,
  ProductVariant,
  ProductImage,
  ProductReview,
  Category,
} from './products/entities/product.entity';
import { CartItem } from './cart/entities/cart.entity';
import { Order } from './orders/entities/order.entity';

@Module({
  imports: [
    // ✅ Make env variables globally accessible
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ TypeORM config with async + SSL fix
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),

        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),

        // ✅ Load all entities
        entities: [
          User,
          Product,
          ProductVariant,
          ProductImage,
          ProductReview,
          Category,
          Order,
          CartItem,
        ],

        // Never true in production
        synchronize: false,
        autoLoadEntities: true,

        // ✅ Secure connection for Render + Supabase
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,

        extra: {
          max: 20, // connection pool size
          connectionTimeoutMillis: 10000,
        },
      }),
    }),

    // ✅ Feature Modules
    AuthModule,
    AdminModule,
    UsersModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
