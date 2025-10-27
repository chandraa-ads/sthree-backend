import { Max, Min } from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

/** ================= USER ENTITY ================= */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  full_name?: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  role?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  whatsapp_no?: string;

  // ✅ replaced single address with multiple addresses
  @Column('text', { array: true, nullable: true })
  addresses?: string[];

  // ✅ added date of birth
  @Column({ type: 'date', nullable: true })
  dob?: string;

  // ✅ added gender field
  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  profile_photo?: string;

  @OneToMany(() => Product, (product) => product.created_by_user)
  productsCreated: Product[];

  @OneToMany(() => ProductReview, (review) => review.user)
  reviews: ProductReview[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  wishlist: any;
}


/** ================= CATEGORY ENTITY ================= */
@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => Product, (product) => product.category_relation)
  products: Product[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/** ================= PRODUCT ENTITY ================= */
@Index('IDX_PRODUCTS_NAME', ['name'])
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int', { nullable: true })
  price?: number;

  @Column('int', { nullable: true })
  original_price?: number;

  @Column('int', { nullable: true })
  discount_percentage?: number;

  @Column('int', { nullable: true })
  stock?: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  category_id?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  main_category?: string;

  @Column({ nullable: true })
  sub_category?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ type: 'text', nullable: true })
  about_item?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  product_detail?: Record<string, any>;

  @Column('text', { array: true, nullable: true })
  images?: string[];

  @Column('text', { array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'text', nullable: true })
  product_size?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  discount_start_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  discount_end_date?: Date;

  @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  published_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  archived_at?: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;


  @Column({ type: 'boolean', default: false })
  wishlist: boolean; 
  
  @Column('float', { nullable: true, default: 0 })
  average_rating?: number;

  /** RELATIONS */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category_relation: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true, eager: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductReview, (review) => review.product, { cascade: true, eager: true })
  reviews: ProductReview[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  product_images: ProductImage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

/** ================= PRODUCT VARIANT ENTITY ================= */
@Entity({ name: 'product_variants' })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  size?: string;

  @Column('int', { nullable: true })
  price?: number;

  @Column('int', { nullable: true })
  original_price?: number; // ✅ Added

  @Column('int', { nullable: true })
  discount_percentage?: number; // ✅ Added

  @Column('int', { nullable: true })
  stock?: number;

  @Index()
  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => ProductImage, (image) => image.variant, { cascade: true })
  images: ProductImage[];

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;
}

/** ================= PRODUCT IMAGE ENTITY ================= */
@Entity({ name: 'product_images' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  image_url: string;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ type: 'uuid', nullable: true })
  variant_id?: string;

  @Column({ type: 'uuid', nullable: true })
  product_id?: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @ManyToOne(() => Product, (product) => product.product_images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

/** ================= PRODUCT REVIEW ENTITY ================= */
// product-review.entity.ts
// import { User } from '../../users/entities/user.entity'; // path to your User entity


@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  product_id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ default: '' })
  comment: string;


  // ✅ Store both images and videos
  @Column('json', { nullable: true })
  media: {
    type: 'image' | 'video' | 'gif';
    url: string;
  }[];

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => ProductReview, (review) => review.user)
  reviews: ProductReview[];



  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}

