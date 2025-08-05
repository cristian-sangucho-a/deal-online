import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { UserEventPayloadDto } from './dto/user-event-payload.dto';
import { AuctionClosedPayloadDto } from './dto/auction-closed-payload.dto';
import { NewBidPayloadDto } from './dto/new-bid-payload.dto';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Suscriptor para el evento 'user_registered'
  @EventPattern('user_registered')
  async handleUserRegistered(
    @Payload() data: UserEventPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log(
      `[Email Service] Recibido evento 'user_registered' para: ${data.email}`,
    );

    try {
      await this.emailService.sendVerificationEmail(data);
      // Confirma a RabbitMQ que el mensaje se procesó con éxito (lo saca de la cola)
      channel.ack(originalMsg);
    } catch (error) {
      console.error(
        'Error procesando user_registered. Mensaje devuelto a la cola (o descartado).',
        error,
      );
      // Rechaza el mensaje sin volver a ponerlo en cola. En un sistema real,
      // podrías reenviarlo a una "dead-letter queue" para inspección manual.
      channel.nack(originalMsg, false, false);
    }
  }

  // Suscriptor para el evento 'password_reset_request'
  @EventPattern('password_reset_request')
  async handlePasswordResetRequest(
    @Payload() data: UserEventPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log(
      `[Email Service] Recibido evento 'password_reset_request' para: ${data.email}`,
    );

    try {
      await this.emailService.sendPasswordResetEmail(data);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(
        'Error procesando password_reset_request. Mensaje devuelto a la cola (o descartado).',
        error,
      );
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('new_bid')
  async handleNewBid(
    @Payload() data: NewBidPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log(
      `[Email Service] Recibido evento 'new_bid' para: ${data.productName}`,
    );

    try {
      await this.emailService.sendNewBidNotification(data);
      channel.ack(originalMsg);
    } catch (error) {
      console.error('Error procesando new_bid. Mensaje no confirmado.', error);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('auction_closed')
  async handleAuctionClosed(
    @Payload() data: AuctionClosedPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log(
      `[Email Service] Recibido evento 'auction_closed' para: ${data.productName}`,
    );

    try {
      await this.emailService.sendAuctionClosedNotification(data);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(
        'Error procesando auction_closed. Mensaje no confirmado.',
        error,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
