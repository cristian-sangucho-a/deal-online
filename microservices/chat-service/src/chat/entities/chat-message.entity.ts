import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  auction_id: number;

  @Column({ type: 'integer' })
  user_id: number;

  @Column()
  username: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  created_at: Date;
}
