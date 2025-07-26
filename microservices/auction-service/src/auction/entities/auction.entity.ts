import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';
import { Bid } from './bid.entity';

export type AuctionStatus = 'pending' | 'active' | 'finished' | 'cancelled';

@Entity('auctions')
export class Auction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  start_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  current_price: number;

  @Column()
  end_time: Date;

  @Column({ type: 'enum', enum: ['pending', 'active', 'finished', 'cancelled'], default: 'pending' })
  status: AuctionStatus;

  @Column({ nullable: true })
  winner_id: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Product, product => product.auction, { cascade: true })
  @JoinColumn()
  product: Product;

  @OneToMany(() => Bid, bid => bid.auction)
  bids: Bid[];
}
