// import 'reflect-metadata';
// import { DataSource } from 'typeorm';
// import * as dotenv from 'dotenv';
// dotenv.config();

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   port: +(process.env.DB_PORT || 5432),
//   username: process.env.DB_USER || 'sthree',
//   password: process.env.DB_PASS || '12345',
//   database: process.env.DB_NAME || 'ecommerce_db',
//   entities: [
//     'src/user/entities/*.entity{.ts,.js}',
//     'src/product/entities/*.entity{.ts,.js}',
//     'src/cart/entities/*.entity{.ts,.js}',
//     // 'src/orders/entities/*.entity{.ts,.js}',
//   ],
//   migrations: ['src/migrations/*{.ts,.js}'],
//   synchronize: false,
// });
