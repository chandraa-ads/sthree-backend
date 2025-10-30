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

// ✅ Force Node to prefer IPv4 DNS lookups (avoids Render IPv6 crash)
import * as nodeDns from 'dns';
nodeDns.setDefaultResultOrder('ipv4first');

@Module({
  imports: [
    // ✅ Make .env variables globally accessible
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ TypeORM config tuned for Render PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const dbHost = config.get<string>('DB_HOST');
        const dbPort = parseInt(config.get<string>('DB_PORT') ?? '5432', 10);
        const dbUser = config.get<string>('DB_USER');
        const dbPass = config.get<string>('DB_PASS');
        const dbName = config.get<string>('DB_NAME');
        const dbUrl = config.get<string>('DATABASE_URL');

        console.log('🧠 DB Config:', {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          name: dbName,
          usingUrl: !!dbUrl,
        });

        return dbUrl
          ? {
              type: 'postgres',
              url: dbUrl,
              autoLoadEntities: true,
              synchronize: false,
              ssl: { rejectUnauthorized: false },
              extra: {
                connectionTimeoutMillis: 10000,
                max: 50,
                family: 4, // IPv4
              },
            }
          : {
              type: 'postgres',
              host: dbHost ?? 'localhost',
              port: dbPort,
              username: dbUser,
              password: dbPass,
              database: dbName,
              autoLoadEntities: true,
              synchronize: false,
              ssl: { rejectUnauthorized: false },
              extra: {
                connectionTimeoutMillis: 10000,
                max: 50,
                family: 4,
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
