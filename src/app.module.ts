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

    // ✅ TypeORM config with async + SSL + IPv4 fix
    TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const dbHost = config.get<string>('DB_HOST') ?? '';
    const dbPort = parseInt(config.get<string>('DB_PORT') ?? '5432', 10);

    return {
      type: 'postgres',
      host: dbHost.replace('?ip=4', ''), // force IPv4 hostname
      port: dbPort,
      username: config.get<string>('DB_USER'),
      password: config.get<string>('DB_PASS'),
      database: config.get<string>('DB_NAME'),
      ssl: { rejectUnauthorized: false },

      entities: [__dirname + `/../**/*.entity.${process.env.NODE_ENV === 'production' ? 'js' : 'ts'}`],
      synchronize: false,
      autoLoadEntities: true,

      extra: {
        max: 50, // Pool connections
        connectionTimeoutMillis: 10000,
        family: 4, // ✅ forces IPv4
      },
    };
  },
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
