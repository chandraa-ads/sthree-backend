import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  private generateOrderItemsTable(order: any) {
    return (order.order_items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:8px;">${item.product_name}</td>
          <td style="padding:8px;">${item.selected_size || '-'}</td>
          <td style="padding:8px;">${item.selected_color || '-'}</td>
          <td style="padding:8px;">₹${item.price}</td>
          <td style="padding:8px;">${item.quantity}</td>
          <td style="padding:8px;">₹${item.subtotal}</td>
        </tr>
      `
      )
      .join('');
  }

  private generateAdminOrderHTML(order: any, user: any) {
    const itemsHTML = this.generateOrderItemsTable(order);

    return `
      <div style="font-family:sans-serif; color:#333;">
        <h2 style="color:#2E86C1;">🚨 New Order Received</h2>

        <h3>User Details</h3>
        <p><strong>Full Name:</strong> ${user.full_name || '-'}</p>
        <p><strong>Username:</strong> ${user.username || '-'}</p>
        <p><strong>Email:</strong> ${user.email || '-'}</p>
        <p><strong>Phone:</strong> ${user.phone || '-'}</p>
        <p><strong>WhatsApp:</strong> ${user.whatsapp_no || '-'}</p>
       <p><strong>Address:</strong> ${Array.isArray(user.addresses) ? user.addresses.join(', ') : user.addresses || '-'
      }</p>
      <p><strong>Profile Image:</strong> ${user.profile_image ? `<a href="${user.profile_image}">View</a>` : '-'
      }</p>


        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status}</p>
        <p><strong>Total Price:</strong> ₹${order.total_price}</p>
        <p><strong>Payment Info:</strong> ${order.payment_info ? JSON.stringify(order.payment_info) : '-'
      }</p>

        <h4>Shipping Address</h4>
        <p>${order.shipping_address ? JSON.stringify(order.shipping_address) : '-'}</p>

        <h4>Order Items</h4>
        <table style="width:100%; border-collapse:collapse;">
          <thead style="background:#f2f2f2;">
            <tr>
              <th style="padding:8px; text-align:left;">Product</th>
              <th style="padding:8px; text-align:left;">Size</th>
              <th style="padding:8px; text-align:left;">Color</th>
              <th style="padding:8px; text-align:left;">Price</th>
              <th style="padding:8px; text-align:left;">Qty</th>
              <th style="padding:8px; text-align:left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateCustomerOrderHTML(order: any, customerName?: string) {
    const itemsHTML = this.generateOrderItemsTable(order);

    return `
      <div style="font-family:sans-serif; color:#333;">
        <h2 style="color:#2E86C1;">✅ Order Confirmation</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>Thank you for your order! Here are your order details:</p>

        <h4>Order Items</h4>
        <table style="width:100%; border-collapse:collapse;">
          <thead style="background:#f2f2f2;">
            <tr>
              <th style="padding:8px; text-align:left;">Product</th>
              <th style="padding:8px; text-align:left;">Size</th>
              <th style="padding:8px; text-align:left;">Color</th>
              <th style="padding:8px; text-align:left;">Price</th>
              <th style="padding:8px; text-align:left;">Qty</th>
              <th style="padding:8px; text-align:left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <p style="margin-top:20px; font-size:16px;">
          <strong>Total: ₹${order.total}</strong>
        </p>
        <p>
          Payment Method: ${order.payment_method}<br/>
          Status: ${order.status}
        </p>
        <p style="margin-top:20px;">
          Regards,<br/>
          <strong>Shop Team</strong>
        </p>
      </div>
    `;
  }

  async sendAdminOrderEmail(order: any, user: any, adminEmail?: string) {
    try {
      const toEmail = adminEmail || process.env.EMAIL_USER;
      const htmlContent = this.generateAdminOrderHTML(order, user);

      const info = await this.transporter.sendMail({
        from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🚨 New Order Received #${order.id}`,
        html: htmlContent,
      });

      console.log('✅ Admin mail sent:', info.messageId);
    } catch (err: any) {
      console.error('❌ Admin email failed:', err.message || err);
      throw new InternalServerErrorException(
        'Admin notification failed: ' + (err.message || 'Unknown error'),
      );
    }
  }

  async sendCustomerOrderEmail(
    order: any,
    customerEmail: string,
    customerName?: string,
  ) {
    try {
      const htmlContent = this.generateCustomerOrderHTML(order, customerName);

      const info = await this.transporter.sendMail({
        from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `✅ Order Confirmation #${order.id}`,
        html: htmlContent,
      });

      console.log('✅ Customer mail sent:', info.messageId);
    } catch (err: any) {
      console.error('❌ Customer email failed:', err.message);
      throw new InternalServerErrorException(
        'Customer notification failed: ' + err.message,
      );
    }
  }

async sendOrderNotifications(order, user, userEmail, userName, adminEmail) {
  // 🧩 Ensure order_items always exists (avoid "undefined.map" error)
  const items = Array.isArray(order.order_items) ? order.order_items : [];

  const isDelivery = order.status === 'success';

  // ✅ Subject lines
  const userSubject = isDelivery
    ? `✅ Order Delivered Successfully #${order.id}`
    : `✅ Order Confirmation #${order.id}`;

  const adminSubject = isDelivery
    ? `📦 Order Delivered - ${order.id}`
    : `🚨 New Order Received #${order.id}`;

  // ✅ Customer Email Body
  const userBody = `
  <h2>${isDelivery ? '✅ Order Delivered Successfully' : '✅ Order Confirmation'}</h2>
  <p>Hi <strong>${userName}</strong>,</p>
  <p>${
    isDelivery
      ? 'Your order has been successfully delivered! Thank you for shopping with us.'
      : 'Thank you for your order! Here are your order details:'
  }</p>

  <h3>Order Items</h3>
  <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse;">
    <tr>
      <th>Product</th><th>Size</th><th>Color</th><th>Price</th><th>Qty</th><th>Subtotal</th>
    </tr>
    ${
      items.length > 0
        ? items
            .map(
              (item) => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.selected_size || '-'}</td>
          <td>${item.selected_color || '-'}</td>
          <td>₹${item.price}</td>
          <td>${item.quantity}</td>
          <td>₹${item.subtotal}</td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="6" style="text-align:center;">No items found</td></tr>`
    }
  </table>

  <p><strong>Total:</strong> ₹${order.total_price}</p>
  <p><strong>Payment Method:</strong> ${order.payment_method}</p>
  <p><strong>Status:</strong> ${order.status}</p>

  <p>Regards,<br/>Shop Team</p>
  `;

  // ✅ Admin Email Body
  const adminBody = `
  <h2>${adminSubject}</h2>
  <h3>User Details</h3>
  <p><strong>Full Name:</strong> ${user.full_name || '-'}</p>
  <p><strong>Username:</strong> ${user.username || '-'}</p>
  <p><strong>Email:</strong> ${user.email || '-'}</p>
  <p><strong>Phone:</strong> ${user.phone || '-'}</p>
  <p><strong>WhatsApp:</strong> ${user.whatsapp_no || '-'}</p>
  <p><strong>Address:</strong> ${
    Array.isArray(user.addresses) ? user.addresses.join(', ') : user.addresses || '-'
  }</p>
  <p><strong>Profile Image:</strong> ${user.profile_image || '-'}</p>

  <hr/>

  <h3>Order Details</h3>
  <p><strong>Order ID:</strong> ${order.id}</p>
  <p><strong>Payment Method:</strong> ${order.payment_method}</p>
  <p><strong>Status:</strong> ${order.status}</p>
  <p><strong>Payment Status:</strong> ${order.payment_status}</p>
  <p><strong>Total Price:</strong> ₹${order.total_price}</p>
  <p><strong>Payment Info:</strong> ${
    order.payment_info ? JSON.stringify(order.payment_info) : '-'
  }</p>

  <h4>Shipping Address</h4>
  <pre>${JSON.stringify(order.shipping_address, null, 2)}</pre>

  <h4>Order Items</h4>
  <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse;">
    <tr>
      <th>Product</th><th>Size</th><th>Color</th><th>Price</th><th>Qty</th><th>Subtotal</th>
    </tr>
    ${
      items.length > 0
        ? items
            .map(
              (i) => `
        <tr>
          <td>${i.product_name}</td>
          <td>${i.selected_size || '-'}</td>
          <td>${i.selected_color || '-'}</td>
          <td>₹${i.price}</td>
          <td>${i.quantity}</td>
          <td>₹${i.subtotal}</td>
        </tr>`
            )
            .join('')
        : `<tr><td colspan="6" style="text-align:center;">No items found</td></tr>`
    }
  </table>
  `;

  // ✅ Send both emails separately
  try {
    // Send user email
    await this.transporter.sendMail({
      from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: userSubject,
      html: userBody,
    });
    console.log('📧 User confirmation email sent:', userEmail);

    // Send admin email
    if (adminEmail) {
      await this.transporter.sendMail({
        from: `"Shop Orders" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: adminSubject,
        html: adminBody,
      });
      console.log('📧 Admin notification email sent:', adminEmail);
    } else {
      console.warn('⚠️ Admin email not configured.');
    }
  } catch (err) {
    console.error('❌ Failed to send notification email:', err.message);
    throw new InternalServerErrorException('Email notification failed');
  }
}





}
