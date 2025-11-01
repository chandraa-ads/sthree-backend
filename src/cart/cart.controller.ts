import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiBody({ type: AddToCartDto })
  async addToCart(@Body() dto: AddToCartDto) {
    if (!dto.user_id) {
      throw new BadRequestException('user_id is required');
    }
    return this.cartService.addToCart(dto);
  }

  @Get()
  async getCart(@Query('user_id') user_id: string) {
    if (!user_id) {
      throw new BadRequestException('user_id is required');
    }
    return this.cartService.getCartByUser(user_id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateCartDto })
  async updateCart(
    @Param('id') id: string,
    @Body() dto: UpdateCartDto & { user_id?: string },
  ) {
    const { user_id } = dto;
    if (!user_id) {
      throw new BadRequestException('user_id is required');
    }
    return this.cartService.updateCart(id, user_id, dto);
  }

  @Delete(':id')
  async removeFromCart(
    @Param('id') id: string,
    @Query('user_id') user_id: string,
  ) {
    if (!user_id) {
      throw new BadRequestException('user_id is required');
    }
    return this.cartService.removeFromCart(id, user_id);
  }

  @Delete('clear/:user_id')
  async clearCart(@Param('user_id') user_id: string) {
    return this.cartService.clearCart(user_id);
  }

  
}
