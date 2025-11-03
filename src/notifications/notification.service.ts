import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly senderEmail = process.env.EMAIL_USER || ''; // ensure always string

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.senderEmail,
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
      `,
      )
      .join('');
  }

  // ✅ Updated: Checks both state and city
  private getDeliveryEstimate(state?: string, city?: string) {
    const location = `${city || ''} ${state || ''}`.toLowerCase().trim();

    if (location.includes('coimbatore')) {
      return 'Coimbatore – 3 days';
    }

    return '5 days';
  }

  private getContactInfoHTML() {
    return `
      <p style="margin-top:20px;">
        📞 For any query, call or WhatsApp us at: 
        <a href="tel:+918903284455" style="color:#1E88E5; text-decoration:none;">+91 89032 84455</a> |
        <a href="https://wa.me/918903284455" style="color:#25D366; text-decoration:none;">WhatsApp</a>
      </p>
    `;
  }

  private generateAdminOrderHTML(order: any, user: any) {
    const itemsHTML = this.generateOrderItemsTable(order);
    const deliveryFeeHTML =
      order.delivery_fee && Number(order.delivery_fee) > 0
        ? `<p><strong>Delivery Fee:</strong> ₹${order.delivery_fee}</p>`
        : `<p><strong>Delivery Fee:</strong> Free</p>`;

    const city = order?.shipping_address?.city || user?.city || '-';
    const state = order?.shipping_address?.state || user?.state || '-';
    const deliveryEstimate = this.getDeliveryEstimate(state, city);

    return `
      <div style="font-family:sans-serif; color:#333;">
        <h2 style="color:#C0392B;">🚨 New Order Received #${order.id}</h2>

        <h3>User Details</h3>
        <p><strong>Full Name:</strong> ${user.full_name || '-'}</p>
        <p><strong>Username:</strong> ${user.username || '-'}</p>
        <p><strong>Email:</strong> ${user.email || '-'}</p>
        <p><strong>Phone:</strong> ${user.phone || '-'}</p>
        <p><strong>WhatsApp:</strong> ${user.whatsapp_no || '-'}</p>
        <p><strong>Address:</strong> ${user.address || '-'}</p>
        <p><strong>State:</strong> ${user.state || '-'}</p>
        <p><strong>Profile Image:</strong> ${
          user.profile_image
            ? `<a href="${user.profile_image}" target="_blank">View Image</a>`
            : '-'
        }</p>

        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment Status:</strong> ${order.payment_status}</p>
        ${deliveryFeeHTML}
        <p><strong>Total Price:</strong> ₹${order.total_price}</p>
        <p><strong>Payment Info:</strong> ${order.payment_info || '-'}</p>
        <p><strong>Estimated Delivery:</strong> ${deliveryEstimate}</p>

        ${
          order.shipping_address
            ? `
          <h4>Shipping Address</h4>
          <pre style="background:#f7f7f7; padding:10px; border-radius:5px;">${JSON.stringify(
            order.shipping_address,
            null,
            2,
          )}</pre>
        `
            : ''
        }

        <h4>Order Items</h4>
        <table style="width:100%; border-collapse:collapse;">
          <thead style="background:#f2f2f2;">
            <tr>
              <th style="padding:8px;">Product</th>
              <th style="padding:8px;">Size</th>
              <th style="padding:8px;">Color</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Qty</th>
              <th style="padding:8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>

        ${this.getContactInfoHTML()}
      </div>
    `;
  }

  private generateCustomerOrderHTML(order: any, customer: any) {
    const itemsHTML = this.generateOrderItemsTable(order);
    const deliveryFeeHTML =
      order.delivery_fee && Number(order.delivery_fee) > 0
        ? `<p><strong>Delivery Fee:</strong> ₹${order.delivery_fee}</p>`
        : `<p><strong>Delivery Fee:</strong> Free</p>`;

    const city = order?.shipping_address?.city || customer?.city || '-';
    const state = order?.shipping_address?.state || customer?.state || '-';
    const deliveryEstimate = this.getDeliveryEstimate(state, city);

    return `
      <div style="font-family:sans-serif; color:#333;">
        <h2 style="color:#2E86C1;">✅ Order Confirmation</h2>
        <p>Hi ${customer?.full_name || 'Customer'},</p>
        <p>Thank you for your order! Here are your order details:</p>

        <h4>Shipping Address</h4>
        ${
          order.shipping_address
            ? `
          <pre style="background:#f7f7f7; padding:10px; border-radius:5px;">${JSON.stringify(
            order.shipping_address,
            null,
            2,
          )}</pre>
        `
            : '<p>No shipping address provided.</p>'
        }

        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead style="background:#f2f2f2;">
            <tr>
              <th style="padding:8px;">Product</th>
              <th style="padding:8px;">Size</th>
              <th style="padding:8px;">Color</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Qty</th>
              <th style="padding:8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>

        ${deliveryFeeHTML}
        <p style="margin-top:10px;"><strong>Total:</strong> ₹${order.total_price}</p>
        <p><strong>Payment Method:</strong> ${order.payment_method}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Estimated Delivery:</strong> ${deliveryEstimate}</p>

        ${this.getContactInfoHTML()}

        <p style="margin-top:20px;">Regards,<br/><strong>Shop Team</strong></p>
      </div>
    `;
  }

  async sendOrderNotifications(order, user, userEmail, userName, adminEmail) {
    try {
      const userHTML = this.generateCustomerOrderHTML(order, user);
      const adminHTML = this.generateAdminOrderHTML(order, user);

      // ✅ Send to customer
      await this.transporter.sendMail({
        from: `"Shop Orders" <${this.senderEmail}>`,
        to: userEmail,
        subject: `✅ Order Confirmation #${order.id}`,
        html: userHTML,
      });

      // ✅ Send to admin
      if (adminEmail) {
        await this.transporter.sendMail({
          from: `"Shop Orders" <${this.senderEmail}>`,
          to: adminEmail,
          subject: `🚨 New Order Received #${order.id}`,
          html: adminHTML,
        });
      }
    } catch (err) {
      console.error('❌ Failed to send notification email:', err.message);
      throw new InternalServerErrorException('Email notification failed');
    }
  }
}
