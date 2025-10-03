// src/orders/orders.controller.ts
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ------------------ Create Order ------------------
  @Post()
  @ApiOperation({ summary: 'Create new order from cart items' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // ------------------ Admin: Get All Orders ------------------
  @Get('admin')
  @ApiOperation({ summary: 'Get all orders with filters (admin)' })
  async findAll(
    @Query('status') status?: string,
    @Query('payment_status') payment_status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('user') user?: string,
  ) {
    return this.ordersService.findAllWithFilters({ status, payment_status, from, to, user });
  }

  // ------------------ Get Single Order ------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get single order with items (user or admin)' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // ------------------ Get Orders for a User ------------------
  @Get('my/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  async findUserOrders(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // Webhook for payment success
   @Post('payment-success/:orderId')
  async paymentSuccess(
    @Param('orderId') orderId: string,
    @Body() body: { transaction_id: string; method: string }
  ) {
    return await this.ordersService.updatePaymentStatus(orderId, body);
  }
}
