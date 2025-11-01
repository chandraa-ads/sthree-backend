import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🔹 CREATE ORDER (Supports file upload)
  @Post()
  @ApiOperation({ summary: 'Create new order (supports file upload)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create Order Request',
    type: CreateOrderDto,
  })
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    try {
      console.log('📥 Incoming Body:', body);

      // ✅ Safely parse JSON string fields
      const parsedShippingAddress =
        typeof body.shipping_address === 'string'
          ? JSON.parse(body.shipping_address)
          : body.shipping_address;

      const parsedItems =
        typeof body.items === 'string' ? JSON.parse(body.items) : body.items;

      // ✅ Ensure parsedItems is always an array
      const itemsArray: any[] = Array.isArray(parsedItems)
        ? parsedItems
        : [parsedItems];

      // ✅ Construct DTO
      const dto: CreateOrderDto = {
        user_id: body.user_id,
        payment_method: body.payment_method,
        shipping_address: parsedShippingAddress,
        items: itemsArray.map((item, i) => ({
          ...item,
          image_url:
            item.image_url ||
            (files && files[i] ? `/uploads/${files[i].filename}` : null),
        })),
      };

      console.log('🧾 Final DTO:', dto);

      return await this.ordersService.create(dto);
    } catch (error) {
      console.error('❌ Error in OrdersController.create:', error);
      throw new InternalServerErrorException(
        error.message || 'Internal server error',
      );
    }
  }

  // 🔹 Admin: Get orders with filters
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

  // 🔹 Admin: Get all orders (no filters)
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all orders (no filters)' })
  async getAllOrdersWithoutFilters() {
    return this.ordersService.findAllWithoutFilters();
  }

  // 🔹 Paginated Orders
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
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;

    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (payment_status) filters.payment_status = payment_status;
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (user) filters.user = user;

    return this.ordersService.findAllWithPagination(pageNum, limitNum, filters);
  }

  // 🔹 Get single order
  @Get(':id')
  @ApiOperation({ summary: 'Get single order with items (user or admin)' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // 🔹 Get user orders
  @Get('my/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  async findUserOrders(@Param('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // 🔹 Payment success
  @Post('payment-success/:orderId')
  @ApiOperation({ summary: 'Update payment status to success for order' })
  async paymentSuccess(
    @Param('orderId') orderId: string,
    @Body() body: { transaction_id: string; method: string },
  ) {
    return this.ordersService.updatePaymentStatus(orderId, body);
  }

  // 🔹 Export orders
  @Get('admin/export')
  @ApiOperation({ summary: 'Export all orders to Excel (admin)' })
  async exportOrdersExcel(@Res() res: Response) {
    return this.ordersService.exportOrdersToExcel(res);
  }

  // 🔹 Confirm order
  @Post('admin/confirm/:orderId')
  @ApiOperation({ summary: 'Admin confirms an order (pending → confirmed)' })
  async confirmOrder(@Param('orderId') orderId: string) {
    return this.ordersService.confirmOrder(orderId);
  }
}
