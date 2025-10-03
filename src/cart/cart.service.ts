import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { supabase } from '../config/database.config';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  // Add product to cart
  async addToCart(dto: AddToCartDto) {
    const { user_id, product_id, quantity, selected_size } = dto;

    // Check if product with same size already exists in cart
    const { data: existing } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', product_id)
      .eq('selected_size', selected_size)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { message: 'Cart updated', cart: data };
    }

    // Insert new record
    const { data, error } = await supabase
      .from('cart')
      .insert([{ user_id, product_id, quantity, selected_size }])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Product added to cart', cart: data };
  }

  // Get user cart
  async getCart(user_id: string) {
    const { data, error } = await supabase
      .from('cart')
      .select(`
        id,
        quantity,
        selected_size,
        products(id, name, price, stock, image, brand, main_category, sub_category, product_size)
      `)
      .eq('user_id', user_id);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // Update cart item quantity
  async updateCart(id: string, dto: UpdateCartDto) {
    const updatePayload: any = { quantity: dto.quantity };
    if (dto.selected_size) updatePayload.selected_size = dto.selected_size;

    const { data, error } = await supabase
      .from('cart')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('Cart item not found');
    return { message: 'Cart updated', cart: data };
  }

  // Remove item from cart
  async removeFromCart(id: string) {
    const { error } = await supabase.from('cart').delete().eq('id', id);
    if (error) throw new NotFoundException('Cart item not found');
    return { message: 'Item removed from cart' };
  }

  // Clear user cart
  async clearCart(user_id: string) {
    const { error } = await supabase.from('cart').delete().eq('user_id', user_id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Cart cleared successfully' };
  }
}
