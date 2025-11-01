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
        // 🚀 Force IPv4 DNS resolution if requested
        if (config.get<string>('DB_FORCE_IPV4') === 'true') {
          dns.setDefaultResultOrder('ipv4first');
          console.log('🔧 Forcing IPv4 DNS resolution');
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT')) || 5432,
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],

          synchronize:
            config.get<string>('NODE_ENV') !== 'production' ? true : false,

          ssl:
            config.get<string>('DB_SSL') === 'true' ||
            config.get<boolean>('DB_SSL') === true
              ? {
                  rejectUnauthorized:
                    config.get<string>('DB_SSL_REJECT_UNAUTHORIZED') ===
                      'true' ||
                    config.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED') === true,
                }
              : false,

          extra: {
            family: 4, // ✅ Force IPv4 socket connection
          },
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
