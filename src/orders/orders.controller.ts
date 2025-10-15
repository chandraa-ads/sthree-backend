import { Controller, Post, Get, Body, Param, Query, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Create Order
  @Post()
  @ApiOperation({ summary: 'Create new order from cart items' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // Admin: Get all orders with optional filters
  @Get('admin')
  @ApiOperation({ summary: 'Get all orders with filters (admin)' })
  async findAll(
    @Query('status') status?: string,
    @Query('payment_status') payment_status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('user') user?: string,
  ) {
    return this.ordersService.findAllWithFilters({
      status,
      payment_status,
      from,
      to,
      user,
    });
  }

  // Admin: Get all orders without filters
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all orders (no filters)' })
  async getAllOrdersWithoutFilters() {
    return this.ordersService.findAllWithoutFilters();
  }

  @Get()
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('payment_status') payment_status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('user') user?: string,
  ) {
    // Parse page and limit to numbers, default to page=1, limit=10 if missing or invalid
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;

    // Build filters object only with provided values
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (payment_status) filters.payment_status = payment_status;
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (user) filters.user = user;

    const result = await this.ordersService.findAllWithPagination(
      pageNum,
      limitNum,
      filters,
    );
    return result;
  }

  // Get single order by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get single order with items (user or admin)' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Get orders for a specific user
  @Get('my/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  async findUserOrders(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // Webhook or endpoint for payment success update
  @Post('payment-success/:orderId')
  @ApiOperation({ summary: 'Update payment status to success for order' })
  async paymentSuccess(
    @Param('orderId') orderId: string,
    @Body() body: { transaction_id: string; method: string },
  ) {
    return await this.ordersService.updatePaymentStatus(orderId, body);
  }

  @Get('admin/export')
  @ApiOperation({ summary: 'Export all orders to Excel (admin)' })
  async exportOrdersExcel(@Res() res: Response) {
    return this.ordersService.exportOrdersToExcel(res);
  }
}
