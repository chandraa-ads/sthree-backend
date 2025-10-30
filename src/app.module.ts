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

// ✅ Force IPv4 DNS resolution (Render + Supabase fix)
dns.setDefaultResultOrder('ipv4first');

// ✅ Import all entities properly
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
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),

        // ✅ Include all entities
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

        synchronize: false, // never true in production
        autoLoadEntities: true,

        // ✅ Enable SSL for Render/Supabase
        ssl: {
          rejectUnauthorized: false,
        },

        extra: {
          max: 50, // connection pool limit
          host: config.get<string>('DB_HOST'),
        },
      }),
    }),

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
