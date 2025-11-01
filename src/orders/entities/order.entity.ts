import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// ✅ Single order item structure with variant info
export interface OrderItem {
  product_id: string;
  product_variant_id?: string | null;   // Optional variant product id
  product_name: string;
  price: number;
  quantity: number;
  selected_size?: string | null;
  selected_color?: string | null;
  subtotal?: number;                    // price * quantity (can be computed before insert)
  image_url?: string | null;            // ✅ Added field for product image
}

// ✅ Shipping address structure
export interface ShippingAddress {
  line1: string;
  city: string;
  pincode: string;
}

// ✅ Payment info structure
export interface PaymentInfo {
  transaction_id?: string;
  method?: string;
  paid_at?: string;
}

// ✅ Order entity
@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  user_id!: string;

  @Column({ type: 'jsonb' })
  items!: OrderItem[]; // includes image_url in each item

  @Column({ type: 'varchar', nullable: true })
  payment_method?: string;

  @Column({ type: 'jsonb', nullable: true })
  shipping_address?: ShippingAddress;

  @Column('int')
  total!: number;

  @Column({ type: 'int', nullable: true })
  total_price?: number;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', default: 'pending' })
  payment_status!: string;

  @Column({ type: 'jsonb', nullable: true })
  payment_info?: PaymentInfo;

  @Column({ type: 'jsonb', nullable: true })
  tracking_info?: any;

  @Column({ type: 'text', nullable: true })
  image_url ?: any;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
