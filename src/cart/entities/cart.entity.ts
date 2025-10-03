import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cart_items' })
export class CartItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Column() productId: string;
  @Column('int') quantity: number;
}
