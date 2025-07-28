import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

// --- INICIO DE LA CORRECCIÓN ---
// Se añade una ruta (path) única para este gateway.
// Ya no se necesita el 'namespace'.
@WebSocketGateway({
  path: '/chat/socket.io',
  cors: { origin: '*' }
})
// --- FIN DE LA CORRECCIÓN ---
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No token provided');
      
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      this.logger.log(`Cliente de Chat conectado: ${client.id}, Usuario: ${payload.email}`);
    } catch (error) {
      this.logger.error(`Autenticación de Chat fallida: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente de Chat desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_chat_room')
  handleJoinRoom(@MessageBody('auctionId') auctionId: number, @ConnectedSocket() client: Socket) {
    const room = `auction_chat_${auctionId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió a la sala de chat ${room}`);
    client.emit('joined_chat_room', { message: `Te has unido al chat de la subasta ${auctionId}` });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() payload: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client.data.user;
    const room = `auction_chat_${payload.auctionId}`;

    const savedMessage = await this.chatService.createMessage({
      ...payload,
      userId: user.sub,
      username: user.name,
    });

    this.server.to(room).emit('new_message', savedMessage);
  }
}
