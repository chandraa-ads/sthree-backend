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

        // ✅ Include all entities here
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

        synchronize: false, // Keep false in production
        autoLoadEntities: true,
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
