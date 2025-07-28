import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Auction } from './auction.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'integer' })
  owner_id: number; // ID del usuario que creó el producto

  @OneToOne(() => Auction, auction => auction.product)
  auction: Auction;
}
