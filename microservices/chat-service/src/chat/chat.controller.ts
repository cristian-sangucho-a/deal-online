import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../common/guards/auth.guard';

@UseGuards(AuthGuard) // Protege todos los endpoints de este controlador
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':auctionId/history')
  getChatHistory(@Param('auctionId', ParseIntPipe) auctionId: number) {
    // Nota: El AuthGuard ya verificó que hay un usuario, así que es seguro
    // permitir que cualquiera con un token válido vea el historial de un chat.
    return this.chatService.getMessagesForAuction(auctionId);
  }
}
