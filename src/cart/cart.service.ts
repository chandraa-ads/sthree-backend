import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartItem } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductsService } from '../products/products.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
    private readonly supabaseService: SupabaseService, // ✅ Inject SupabaseService
  ) {}

  private isDiscountActive(product: any): boolean {
    const now = new Date();
    if (!product.discount_start_date || !product.discount_end_date)
      return false;
    return (
      now >= new Date(product.discount_start_date) &&
      now <= new Date(product.discount_end_date)
    );
  }

  async addToCart(dto: AddToCartDto) {
    const {
      user_id,
      product_id,
      product_variant_id,
      quantity,
      color,
      size,
      name,
      price,
      image_url,
    } = dto;

    // ✅ Fetch product with variants
    const product = await this.productsService.findOne(product_id);
    if (!product) throw new NotFoundException('Product not found');
    if (!product.is_active)
      throw new BadRequestException('Product is currently unavailable');

    let variant: any | undefined;

    if (product_variant_id) {
      const { data: variantList, error } = await this.supabaseService.client
        .from('product_variants')
        .select('*')
        .eq('id', product_variant_id);

      if (error || !variantList || variantList.length === 0) {
        throw new BadRequestException('Variant does not exist');
      }

      variant = variantList[0];
    }

    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock === undefined || availableStock === null) {
      throw new InternalServerErrorException('Stock information missing');
    }
    if (quantity > availableStock) {
      throw new BadRequestException(
        `Requested quantity (${quantity}) exceeds available stock (${availableStock})`,
      );
    }

    const whereClause: Partial<CartItem> = {
      user_id,
      product_id,
      product_variant_id: product_variant_id || undefined,
      color: color || undefined,
      size: size || undefined,
      image_url: image_url || undefined,
    };

    const existing = await this.cartRepository.findOne({ where: whereClause });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > availableStock) {
        throw new BadRequestException(
          `After addition, quantity (${newQty}) exceeds available stock (${availableStock})`,
        );
      }
      existing.quantity = newQty;
      existing.name = name || existing.name;
      existing.price = price || existing.price;
      existing.color = color || existing.color;
      existing.size = size || existing.size;
      existing.image_url = image_url || existing.image_url;

      await this.cartRepository.save(existing);
    } else {
      const createData: Partial<CartItem> = {
        user_id,
        product_id,
        product_variant_id,
        quantity,
        color,
        size,
        name,
        price,
        image_url,
      };
      const newItem = this.cartRepository.create(createData);
      await this.cartRepository.save(newItem);
    }

    return this.getCartByUser(user_id);
  }

  async getCartByUser(user_id: string) {
    const items = await this.cartRepository.find({ where: { user_id } });

    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);

    const cart_items = items.map((item) =>
      this._buildCartResponse(item, total_items),
    );

    return { cart_items, total_items };
  }

async updateCart(id: string, user_id: string, dto: UpdateCartDto) {
  const { quantity, product_variant_id, color, size } = dto;
  if (
    quantity === undefined &&
    product_variant_id === undefined &&
    !color &&
    !size
  ) {
    throw new BadRequestException('Nothing to update');
  }

  const existing = await this.cartRepository.findOne({
    where: { id, user_id },
  });
  if (!existing) throw new NotFoundException('Cart item not found');

  const product = await this.productsService.findOne(existing.product_id);

  let variant: any | undefined;

  if (product_variant_id) {
    const { data: variantList, error } = await this.supabaseService.client
      .from('product_variants')
      .select('*')
      .eq('id', product_variant_id);

    if (error || !variantList || variantList.length === 0) {
      throw new BadRequestException('Variant does not exist');
    }

    variant = variantList[0];
  } else if (existing.product_variant_id) {
    const { data: variantList, error } = await this.supabaseService.client
      .from('product_variants')
      .select('*')
      .eq('id', existing.product_variant_id);

    if (!error && variantList && variantList.length > 0) {
      variant = variantList[0];
    }
  }

  const allowStock = variant ? variant.stock : product.stock;
  if (allowStock === undefined || allowStock === null) {
    throw new InternalServerErrorException('Stock info missing');
  }

  if (quantity !== undefined && quantity > allowStock) {
    throw new BadRequestException(
      `Quantity (${quantity}) exceeds available stock (${allowStock})`,
    );
  }

  if (quantity !== undefined) existing.quantity = quantity;
  if (product_variant_id !== undefined) existing.product_variant_id = product_variant_id;
  if (color !== undefined) existing.color = color;
  if (size !== undefined) existing.size = size;

  const saved = await this.cartRepository.save(existing);

  const items = await this.cartRepository.find({ where: { user_id } });
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);

  return this._buildCartResponse(saved, total_items);
}


  async removeFromCart(id: string, user_id: string) {
    const existing = await this.cartRepository.findOne({
      where: { id, user_id },
    });
    if (!existing) throw new NotFoundException('Cart item not found');
    await this.cartRepository.remove(existing);
    return { message: 'Cart item removed' };
  }

  async clearCart(user_id: string) {
    await this.cartRepository.delete({ user_id });
    return { message: 'Cart cleared' };
  }

  private _buildCartResponse(cartItem: CartItem, total_items?: number) {
    return {
      id: cartItem.id,
      product_id: cartItem.product_id,
      product_variant_id: cartItem.product_variant_id || null,
      name: cartItem.name,
      price: cartItem.price,
      color: cartItem.color,
      size: cartItem.size,
      image_url: cartItem.image_url,
      quantity: cartItem.quantity,
      total_items: total_items ?? cartItem.quantity,
    };
  }
}
