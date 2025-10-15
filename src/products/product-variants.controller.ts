import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductVariantsService } from './product-variants.service';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { JwtAuthGuard } from 'src/utils/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/utils/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiBearerAuth()
@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'variant_images', maxCount: 10 }]))
async create(
  @Body() dto: CreateVariantDto,
  @UploadedFiles() files: { variant_images?: Express.Multer.File[] },
  @Req() req
) {
  return this.productVariantsService.create(dto, files.variant_images || [], req.user.id);
}




  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'variant_images', maxCount: 10 }]))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
    @UploadedFiles() files: { variant_images?: Express.Multer.File[] },
    @Req() req,
  ) {
    return this.productVariantsService.update(id, dto, files.variant_images || [], req.user.id);
  }

  @Get('product/:productId')
  async getVariantsByProduct(@Param('productId') productId: string) {
    return this.productVariantsService.getVariantsByProduct(productId);
  }

  @Get(':id')
  async getVariant(@Param('id') id: string) {
    return this.productVariantsService.getVariant(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    return this.productVariantsService.remove(id, req.user.id);
  }
}
