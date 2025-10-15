import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cart' })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  product_variant_id?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string; // ✅ added name

  @Column({ type: 'numeric', nullable: true })
  price?: number; // ✅ added price

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string; // ✅ added image_url
}
