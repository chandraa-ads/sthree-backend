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
import * as dns from 'dns';

@Module({
  imports: [
    // ✅ Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ PostgreSQL connection setup
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // 🚀 Optional: Force IPv4 DNS resolution if requested
        if (config.get<string>('DB_FORCE_IPV4') === 'true') {
          dns.setDefaultResultOrder('ipv4first');
          console.log('🔧 Forcing IPv4 DNS resolution');
        }

        const useSSL =
          config.get<string>('DB_SSL') === 'true' ||
          config.get<boolean>('DB_SSL') === true;

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT')) || 5432,
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: config.get<string>('NODE_ENV') !== 'production',

          // ✅ Use SSL if DB_SSL=true
          ssl: useSSL ? { rejectUnauthorized: false } : false,

          // ✅ Prefer IPv4 connection if DNS returns both IPv6 & IPv4
          extra: { family: 4 },
        };
      },
    }),

    // ✅ Feature modules
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
