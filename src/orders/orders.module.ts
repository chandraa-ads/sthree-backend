// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NotificationService } from 'src/notifications/notification.service';

@Module({
  imports: [
    // ✅ Use memory storage so files are available as Buffer (for Supabase upload)
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max per file
      },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, NotificationService],
  exports: [OrdersService],
})
export class OrdersModule {}
