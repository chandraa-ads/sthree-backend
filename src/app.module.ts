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
import dns from 'dns/promises';

// ✅ Force IPv4 for Node DNS resolver globally
import * as nodeDns from 'dns';
nodeDns.setDefaultResultOrder('ipv4first');

// ✅ Explicit entities (optional but clean)
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

// ✅ Helper: Resolve IPv4 address from host
async function resolveIPv4(host: string): Promise<string> {
  try {
    const addresses = await dns.resolve4(host);
    if (addresses.length > 0) return addresses[0];
  } catch (err) {
    console.warn('IPv4 resolution failed, fallback to hostname:', err.message);
  }
  return host;
}

@Module({
  imports: [
    // ✅ Make .env variables globally accessible
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ TypeORM Config (Async + SSL + IPv4)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const dbHost = config.get<string>('DB_HOST') ?? 'localhost';
        const resolvedHost = await resolveIPv4(dbHost); // ✅ Force IPv4
        const dbPort = parseInt(config.get<string>('DB_PORT') ?? '5432', 10);

        return {
          type: 'postgres',
          host: resolvedHost,
          port: dbPort,
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          ssl: { rejectUnauthorized: false },
          synchronize: false,
          autoLoadEntities: true,

          // ✅ Connection pooling and IPv4 enforcement
          extra: {
            max: 50,
            connectionTimeoutMillis: 10000,
            family: 4, // ensures IPv4 only
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
