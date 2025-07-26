import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

interface MessageInput {
  auctionId: number;
  userId: number;
  username: string;
  message: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  async createMessage(input: MessageInput): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      auction_id: input.auctionId,
      user_id: input.userId,
      username: input.username,
      message: input.message,
    });
    return this.messageRepository.save(message);
  }

  async getMessagesForAuction(auctionId: number): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { auction_id: auctionId },
      order: { created_at: 'ASC' },
    });
  }
}
