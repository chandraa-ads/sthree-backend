import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
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
    return this.cartService.addToCart(dto);
  }

  @Get()
  async getCart(@Query('user_id') user_id: string) {
    return this.cartService.getCart(user_id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateCartDto })
  async updateCart(@Param('id') id: string, @Body() dto: UpdateCartDto) {
    return this.cartService.updateCart(id, dto);
  }

  @Delete(':id')
  async removeFromCart(@Param('id') id: string) {
    return this.cartService.removeFromCart(id);
  }

  @Delete('clear/:user_id')
  async clearCart(@Param('user_id') user_id: string) {
    return this.cartService.clearCart(user_id);
  }
}
