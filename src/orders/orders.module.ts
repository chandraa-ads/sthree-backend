// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NotificationService } from 'src/notifications/notification.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, NotificationService],
  exports: [OrdersService],
})
export class OrdersModule {}
