import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Bid } from './entities/bid.entity';

// --- INICIO DE LA CORRECCIÓN ---
// Se añade una ruta (path) única para este gateway.
// Ya no se necesita el 'namespace'.
@WebSocketGateway({
  path: '/auction/socket.io',
  cors: { origin: '*' }
})
// --- FIN DE LA CORRECCIÓN ---
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('AuctionGateway');

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No token provided');
      
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      this.logger.log(`Cliente de Subasta conectado: ${client.id}, Usuario: ${payload.email}`);
    } catch (error) {
      this.logger.error(`Autenticación de WebSocket (Subasta) fallida: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente de Subasta desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_auction')
  handleJoinAuction(@MessageBody('auctionId') auctionId: number, @ConnectedSocket() client: Socket) {
    const room = `auction_${auctionId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió a la sala de subasta ${room}`);
    client.emit('joined_auction', { message: `Te has unido a la subasta ${auctionId}` });
  }
  
  emitNewBid(auctionId: number, bid: Bid, user: { name: string }) {
    const room = `auction_${auctionId}`;
    const payload = {
        id: bid.id,
        amount: bid.amount,
        userId: bid.user_id,
        username: user.name,
        timestamp: bid.created_at,
    };
    this.server.to(room).emit('new_bid', payload);
  }

  emitPriceUpdate(auctionId: number, newPrice: number) {
    const room = `auction_${auctionId}`;
    this.server.to(room).emit('price_update', { auctionId, newPrice });
  }
}
