// src/orders/orders.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabase } from '../config/database.config';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationService } from '../notifications/notification.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { OrderItem } from './entities/order.entity';
@Injectable()
export class OrdersService {
  constructor(private readonly notificationService: NotificationService) { }


  // ✅ Create a new order
  async create(dto: CreateOrderDto) {
    const { user_id, payment_method, shipping_address, items } = dto;

    if (!items || items.length === 0) {
      throw new InternalServerErrorException('Order must have at least one item');
    }

    console.log('📝 Creating order for user:', user_id);

    const total_price = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = total_price;

    // ✅ Step 1: Insert main order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          payment_method,
          shipping_address,
          items,
          total,
          total_price,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Order creation failed:', error.message);
      throw new InternalServerErrorException(error.message);
    }

    console.log('✅ Order created:', order.id);

    // ✅ Step 2: Enrich each item with image_url from DB
    const orderItemsPayload: any[] = [];


    for (const item of items) {
      // ✅ 1️⃣ Start with whatever the user sent
      let imageUrl = item.image_url ?? null;

      // ✅ 2️⃣ If missing, try variant image
      if (!imageUrl && item.product_variant_id) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('image_url')
          .eq('id', item.product_variant_id)
          .single();
        if (variant?.image_url) imageUrl = variant.image_url;
      }

      // ✅ 3️⃣ If still missing, fallback to product main image
      if (!imageUrl) {
        const { data: product } = await supabase
          .from('products')
          .select('main_image')
          .eq('id', item.product_id)
          .single();
        if (product?.main_image) imageUrl = product.main_image;
      }

      // ✅ 4️⃣ Push to payload
      orderItemsPayload.push({
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id ?? null,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        selected_size: item.selected_size ?? null,
        selected_color: item.selected_color ?? null,
        subtotal: item.price * item.quantity,
        image_url: imageUrl, // ✅ Now correctly set
      });
    }


    // ✅ Step 3: Insert order items
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);

    if (itemsError) {
      console.error('❌ Order items insert failed:', itemsError.message);
      await supabase.from('orders').delete().eq('id', order.id);
      throw new InternalServerErrorException(itemsError.message);
    }

    console.log('✅ Order items inserted with images');

    // ✅ Step 4: Fetch full order details
    const { data: fullOrder, error: fullOrderError } = await supabase
      .from('orders')
      .select(`
      *,
      order_items(
        product_id,
        product_variant_id,
        product_name,
        image_url,
        price,
        quantity,
        selected_size,
        selected_color,
        subtotal
      )
    `)
      .eq('id', order.id)
      .single();

    if (fullOrderError) {
      console.error('❌ Failed to fetch full order:', fullOrderError.message);
      throw new InternalServerErrorException(fullOrderError.message);
    }

    // ✅ Step 5: Send notification emails
    let userData;
    try {
      console.log('📧 Fetching customer info');
      const { data, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username, email, phone, whatsapp_no, addresses, profile_image')
        .eq('id', user_id)
        .single();

      if (userError || !data?.email) {
        console.error('❌ Failed to fetch customer email:', userError?.message || 'Email missing');
      } else {
        userData = data;
        console.log('📧 Sending notifications to admin & customer');
        await this.notificationService.sendOrderNotifications(
          fullOrder,
          userData,
          userData.email,
          userData.full_name,
          process.env.EMAIL_USER
        );
        console.log('✅ Notifications sent successfully');
      }
    } catch (err: any) {
      console.error('❌ Notification process failed:', err.message || err);
    }

    return {
      message: 'Order placed successfully',
      order: fullOrder,
    };
  }




  async findAllWithFilters(filters?: {
    status?: string;
    payment_status?: string;
    from?: string;
    to?: string;
    user?: string;
  }) {
    let query = supabase.from('orders').select(
      `
      *,
      users(full_name, email, phone),
      order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

    `,
    );

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.payment_status)
        query = query.eq('payment_status', filters.payment_status);
      if (filters.from && filters.to)
        query = query
          .gte('created_at', filters.from)
          .lte('created_at', filters.to);
      if (filters.user)
        query = query.ilike('users.full_name', `%${filters.user}%`);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('❌ findAllWithFilters error:', error.message);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findAllWithoutFilters() {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
       order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ findAllWithoutFilters error:', error.message);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findAllWithPagination(
    page = 1,
    limit = 10,
    filters: { [key: string]: string } = {},
  ) {
    let query = supabase.from('orders').select(
      `
      *,
      users(full_name, email, phone),
      order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

    `,
      { count: 'exact' },
    );

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.payment_status)
      query = query.eq('payment_status', filters.payment_status);
    if (filters.from && filters.to)
      query = query
        .gte('created_at', filters.from)
        .lte('created_at', filters.to);
    if (filters.user)
      query = query.ilike('users.full_name', `%${filters.user}%`);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ findAllWithPagination error:', error.message);
      throw new InternalServerErrorException(error.message);
    }

    return {
      data,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  async findOne(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        users(full_name, email, phone),
       order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('❌ findOne error:', error?.message || 'Not found');
      throw new NotFoundException('Order not found');
    }
    return data;
  }

  async findByUser(user_id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
      order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

      `,
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ findByUser error:', error.message);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentDetails: { transaction_id: string; method: string },
  ) {
    // ✅ Step 1: Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'success',
        status: 'success', // ✅ mark as delivered or confirmed
        payment_info: {
          ...paymentDetails,
          paid_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('❌ updatePaymentStatus error:', error.message);
      throw new InternalServerErrorException(error.message);
    }

    console.log('✅ Payment status updated:', order.id);

    // ✅ Step 2: Fetch full order (with items)
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
      *,
      order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

    `)
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('❌ Fetch full order failed:', fetchError.message);
      throw new InternalServerErrorException(fetchError.message);
    }

    // ✅ Step 3: Fetch user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, username, email, phone, whatsapp_no, addresses, profile_image')
      .eq('id', fullOrder.user_id)
      .single();

    if (userError || !userData?.email) {
      console.error('❌ Failed to fetch user info:', userError?.message || 'Missing email');
    } else {
      // ✅ Step 4: Send email to admin and customer
      try {
        await this.notificationService.sendOrderNotifications(
          fullOrder,             // updated order info
          userData,              // customer info
          userData.email,        // customer email
          userData.full_name,    // customer name
          process.env.EMAIL_USER // admin email
        );
        console.log('📧 Order success emails sent to user & admin');
      } catch (err) {
        console.error('❌ Email send failed:', err.message || err);
      }
    }

    return {
      message: 'Payment confirmed and emails sent',
      order: fullOrder,
    };
  }

  async exportOrdersToExcel(res: Response) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
       order_items(
  product_id,
  product_variant_id,
  product_name,
  image_url,
  price,
  quantity,
  selected_size,
  selected_color,
  subtotal
)

      `);

    if (error) {
      console.error('❌ exportOrdersToExcel error:', error.message);
      throw new InternalServerErrorException(error.message);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    // Columns for the Excel file
    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 36 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Status', key: 'payment_status', width: 20 },
      { header: 'Payment Method', key: 'payment_method', width: 20 },
      { header: 'Total Price', key: 'total_price', width: 15 },
      { header: 'Paid At', key: 'paid_at', width: 25 },
      { header: 'Created At', key: 'created_at', width: 25 },
      { header: 'Updated At', key: 'updated_at', width: 25 },
      { header: 'Shipping Address', key: 'shipping_address', width: 50 },
      { header: 'Order Items', key: 'order_items', width: 60 },
    ];

    // Add rows to worksheet
    for (const order of orders) {
      // Format address
      const address = order.shipping_address
        ? `${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.pincode}`
        : 'N/A';

      // Format items
      const itemsStr = (order.order_items || [])
        .map(
          (item) =>
            `${item.product_name} (x${item.quantity}) [${item.selected_color ?? ''} ${item.selected_size ?? ''}] - ₹${item.price}`
        )
        .join('\n');

      // Format paid_at
      const paidAt =
        order.payment_info && order.payment_info.paid_at
          ? new Date(order.payment_info.paid_at).toLocaleString()
          : '';

      worksheet.addRow({
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_price: order.total_price,
        paid_at: paidAt,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipping_address: address,
        order_items: itemsStr,
      });
    }

    // Adjust row height for wrapped text
    worksheet.eachRow((row) => {
      row.height = 40;
    });

    // Set headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // ✅ Admin manually confirms the order (before delivery)
  async confirmOrder(orderId: string) {
    // ✅ Step 1: Update both order status and payment status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'success', // ✅ COD marked as paid when confirmed
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('❌ confirmOrder error:', error.message);
      throw new InternalServerErrorException(error.message);
    }

    const order = Array.isArray(data) ? data[0] : data;
    if (!order) throw new InternalServerErrorException('Order not found after update');

    console.log(`✅ Order confirmed by admin: ${order.id}`);

    // ✅ Step 2: Fetch full order with items
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
      *,
      order_items(
        product_id,
        product_variant_id,
        product_name,
        image_url,
        price,
        quantity,
        selected_size,
        selected_color,
        subtotal
      )
    `)
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Fetch full order failed:', fetchError.message);
    }

    // ✅ Step 3: Fetch user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, username, email, phone, whatsapp_no, addresses')
      .eq('id', order.user_id)
      .maybeSingle();

    if (userError) {
      console.error('❌ Fetch user failed:', userError.message);
    }

    // ✅ Step 4: Send order confirmation email
    if (userData?.email) {
      try {
        await this.notificationService.sendOrderNotifications(
          fullOrder || order,
          userData,
          userData.email,
          userData.full_name,
          process.env.EMAIL_USER,
        );
        console.log('📧 Order confirmation mail sent to user');
      } catch (err) {
        console.error('❌ Email send failed:', err.message || err);
      }
    }

    return { message: 'Order confirmed successfully', order: fullOrder || order };
  }



}
