import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabaseAdmin } from '../config/database.config';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import * as multer from 'multer';
type File = Express.Multer.File;
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Res } from '@nestjs/common';
@Injectable()
export class AdminService {
  // Dashboard
  async dashboard() {
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*');
    if (ordersError)
      throw new InternalServerErrorException(ordersError.message);
    const orders = ordersData || [];

    const total_orders = orders.length;
    const revenue = orders.reduce(
      (sum, o: any) => sum + Number(o.total || 0),
      0,
    );

    const { data: lowStockData, error: lowStockError } = await supabaseAdmin
      .from('products')
      .select('*')
      .lt('stock', 5);
    if (lowStockError)
      throw new InternalServerErrorException(lowStockError.message);
    const lowStock = lowStockData || [];

    const { data: returnsData, error: returnsError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'Return Requested');
    if (returnsError)
      throw new InternalServerErrorException(returnsError.message);
    const returns = returnsData || [];

    return {
      total_orders,
      revenue,
      low_stock: lowStock.length,
      pending_returns: returns.length,
    };
  }

  // Users
  async getUsers() {
    const { data = [], error } = await supabaseAdmin.from('users').select('*');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  // Ensure bucket exists
  private async ensureBucket(bucketName: string) {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error)
      throw new InternalServerErrorException(
        'Failed to list buckets: ' + error.message,
      );

    const bucketExists = buckets.some((b) => b.name === bucketName);
    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        bucketName,
        { public: true },
      );
      if (createError)
        throw new InternalServerErrorException(
          'Failed to create bucket: ' + createError.message,
        );
    }
  }

  // Add product
  async addProduct(dto: CreateProductDto, file: File) {
    if (!file) throw new InternalServerErrorException('Image file is required');

    await this.ensureBucket('products');

    const filePath = `products/${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError)
      throw new InternalServerErrorException(
        'Failed to upload image: ' + uploadError.message,
      );

    const { data: publicData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl)
      throw new InternalServerErrorException('Failed to get public URL');

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{ ...dto, image: publicUrl }])
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);

    return { message: 'Product added successfully', product: data };
  }

  // Update product
  async updateProduct(id: string, dto: UpdateProductDto, file?: File) {
    const { data: existing, error: findError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (findError) throw new NotFoundException('Product not found');

    let updatedData = { ...dto };

    if (file) {
      await this.ensureBucket('products');

      const filePath = `products/${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('products')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError)
        throw new InternalServerErrorException(
          'Failed to upload image: ' + uploadError.message,
        );

      const { data: publicData } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(filePath);
      updatedData.image = publicData?.publicUrl;
      if (!updatedData.image)
        throw new InternalServerErrorException('Failed to get public URL');
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new InternalServerErrorException(error.message);

    return { message: 'Product updated successfully', product: data };
  }


 async exportUsersToExcel(res: Response) {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) throw new InternalServerErrorException(error.message);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Define columns based on all user fields
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Created At', key: 'created_at', width: 25 },
      { header: 'Updated At', key: 'updated_at', width: 25 },
      { header: 'Full Name', key: 'full_name', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Whatsapp No', key: 'whatsapp_no', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Profile Photo', key: 'profile_photo', width: 60 },
    ];

    // Add each user row
    users.forEach((user) => {
      worksheet.addRow(user);
    });

    // Set headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users.xlsx',
    );

    // Write and send workbook
    await workbook.xlsx.write(res);
    res.end();
  }
}
