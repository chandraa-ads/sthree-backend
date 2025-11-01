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
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')) || 5432,
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),

        // ✅ Entities auto-load from your app
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

        // ⚠️ Enable only in dev; turn off in real prod to prevent accidental schema changes
        synchronize:
          config.get<string>('NODE_ENV') !== 'production' ? true : false,

        // ✅ SSL settings for Render / Neon / Supabase PostgreSQL
        ssl:
          config.get<string>('DB_SSL') === 'true' ||
          config.get<boolean>('DB_SSL') === true
            ? {
                rejectUnauthorized:
                  config.get<string>('DB_SSL_REJECT_UNAUTHORIZED') === 'true' ||
                  config.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED') === true,
              }
            : false,

        // ✅ Ensure IPv4 (avoids IPv6 connection issues on Render)
        extra: {
          family: 4,
        },
      }),
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
