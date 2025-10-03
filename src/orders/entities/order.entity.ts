import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// ✅ Single order item structure
export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  selected_size?: string;
  subtotal?: number; // price * quantity
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

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  user_Id!: string;

  @Column({ type: 'jsonb' })
  items!: OrderItem[];

  @Column({ type: 'varchar', nullable: true })
  payment_method?: string;

  @Column({ type: 'jsonb', nullable: true })
  shipping_address?: ShippingAddress;

  @Column('int')
  total!: number;

  @Column({ type: 'int', nullable: true })
  total_price!: number;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', default: 'pending' })
  payment_status!: string;

  @Column({ type: 'jsonb', nullable: true })
  payment_info?: PaymentInfo;

  @Column({ type: 'jsonb', nullable: true })
  tracking_info?: any;

  // ✅ Created timestamp
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  // ✅ Updated timestamp (automatically updated on row update)
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
