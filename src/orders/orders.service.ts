import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { supabase } from '../config/database.config';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  // ✅ Create a new order
  async create(dto: CreateOrderDto) {
    const { user_id, payment_method, shipping_address, items } = dto;

    if (!items || items.length === 0) {
      throw new InternalServerErrorException('Order must have at least one item');
    }

    // ✅ Calculate total and total_price
    const total_price = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = total_price; // Can add taxes, discounts if needed

    // Insert main order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          items,
          payment_method,
          shipping_address,
          total,
          total_price,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // Insert order items
    const orderItemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      selected_size: item.selected_size,
      subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) {
      // Rollback main order if order_items fail
      await supabase.from('orders').delete().eq('id', order.id);
      throw new InternalServerErrorException(itemsError.message);
    }

    return { message: 'Order placed successfully', order, items: orderItemsPayload };
  }

  // ✅ Admin: Get all orders with filters
  async findAllWithFilters(filters?: {
    status?: string;
    payment_status?: string;
    from?: string;
    to?: string;
    user?: string;
  }) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        users(full_name, email, phone),
        order_items(product_id, product_name, price, quantity, selected_size, subtotal)
      `);

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
      if (filters.from && filters.to)
        query = query.gte('created_at', filters.from).lte('created_at', filters.to);
      if (filters.user)
        query = query.ilike('users.full_name', `%${filters.user}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // ✅ Get a single order by ID (admin or user)
  async findOne(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(full_name, email, phone),
        order_items(product_id, product_name, price, quantity, selected_size, subtotal)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Order not found');
    return data;
  }

  // ✅ Get all orders for a single user
  async findByUser(user_id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(product_id, product_name, price, quantity, selected_size, subtotal)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // ✅ Update payment status (on successful payment)
  async updatePaymentStatus(orderId: string, paymentDetails: { transaction_id: string; method: string }) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'success',
        status: 'confirmed',
        payment_info: {
          ...paymentDetails,
          paid_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Payment confirmed', order: data };
  }
}
