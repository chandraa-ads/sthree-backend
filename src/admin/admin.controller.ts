import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { Express } from 'express';


@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('products')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Add new product with image' })
  addProduct(@Body() dto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.adminService.addProduct(dto, file);
  }

  @Patch('products/:id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateProductDto,
    description: 'Product update with optional image',
  })
  @ApiOperation({ summary: 'Update product with optional image' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.updateProduct(id, dto, file);
  }

  @Get('users/export')
  @ApiOperation({ summary: 'Export all users as Excel file' })
  exportUsers(@Res() res: Response) {
    return this.adminService.exportUsersToExcel(res as any);
  }
}

