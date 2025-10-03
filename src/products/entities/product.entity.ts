import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int')
  price: number;

  @Column('int')
  stock: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string; // ✅ New column

  @Column({ nullable: true })
  main_category: string; // ✅ New column

  @Column({ nullable: true })
  sub_category: string; // ✅ New column

  @Column({ nullable: true })
  product_size: string; // ✅ New column

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  customer_review: any[]; 
  // ✅ Store reviews as array of objects [{ user_id, rating, comment }]

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  is_active: boolean;
}
