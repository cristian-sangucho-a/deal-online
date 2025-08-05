import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { AuctionGateway } from './auction.gateway';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
// --- INICIO DE LA MODIFICACIÓN ---
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../auction/entities/user.entity'; // Asumimos que podemos importar User para obtener datos del dueño
// --- FIN DE LA MODIFICACIÓN ---

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Auction) private auctionRepo: Repository<Auction>,
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    private readonly auctionGateway: AuctionGateway,
    private readonly dataSource: DataSource,
    // --- INICIO DE LA MODIFICACIÓN ---
    // Inyectamos el cliente de RabbitMQ que definimos en el módulo.
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    // Inyectamos el repositorio de User para poder buscar los correos de los dueños.
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    // --- FIN DE LA MODIFICACIÓN ---
  ) {}

  async createAuction(dto: CreateAuctionDto, user: any) {
    const product = this.productRepo.create({
      name: dto.productName,
      description: dto.productDescription,
      image_url: dto.imageUrl,
      owner_id: user.userId,
    });

    const auction = this.auctionRepo.create({
      start_price: dto.startPrice,
      current_price: dto.startPrice,
      end_time: dto.endTime,
      product: product,
      status: 'active',
    });

    const savedAuction = await this.auctionRepo.save(auction);

    // --- INICIO DE LA MODIFICACIÓN: Notificación por correo ---
    // Nota: Notificar a TODOS los usuarios no es escalable.
    // Una mejor práctica sería notificar a usuarios que siguen una categoría, etc.
    // Por ahora, emitimos un evento genérico. El email-service podría decidir a quién enviarlo.
    this.emailClient.emit('new_auction_created', {
      productName: savedAuction.product.name,
      startPrice: savedAuction.start_price,
      endTime: savedAuction.end_time,
      auctionId: savedAuction.id,
      creatorName: user.name,
    });
    // --- FIN DE LA MODIFICACIÓN ---

    return savedAuction;
  }

  async placeBid(auctionId: number, dto: PlaceBidDto, user: any) {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const auctionRepo = transactionalEntityManager.getRepository(Auction);
      const bidRepo = transactionalEntityManager.getRepository(Bid);

      const auction = await auctionRepo.findOne({
        where: { id: auctionId },
        relations: ['product'],
      });
      if (!auction) throw new NotFoundException('Subasta no encontrada.');
      if (auction.status !== 'active')
        throw new BadRequestException('La subasta no está activa.');
      if (new Date() > auction.end_time)
        throw new BadRequestException('La subasta ha finalizado.');
      if (dto.amount <= auction.current_price)
        throw new BadRequestException(
          'La puja debe ser mayor al precio actual.',
        );
      if (!auction.product)
        throw new NotFoundException(
          'El producto asociado a esta subasta no fue encontrado.',
        );
      if (auction.product.owner_id === user.userId)
        throw new ForbiddenException('No puedes pujar en tu propia subasta.');

      const newBid = bidRepo.create({
        amount: dto.amount,
        user_id: user.userId,
        auction: auction,
      });
      await bidRepo.save(newBid);

      auction.current_price = dto.amount;
      await auctionRepo.save(auction);

      // Notificaciones por WebSocket (lógica existente)
      this.auctionGateway.emitNewBid(auctionId, newBid, { name: user.name });
      this.auctionGateway.emitPriceUpdate(auctionId, auction.current_price);

      // --- INICIO DE LA MODIFICACIÓN: Notificación por correo al dueño ---
      const productOwner = await this.userRepo.findOneBy({
        id: auction.product.owner_id,
      });
      if (productOwner) {
        this.emailClient.emit('new_bid', {
          productName: auction.product.name,
          productOwnerEmail: productOwner.email,
          productOwnerName: productOwner.nombre,
          bidAmount: newBid.amount,
          bidderName: user.name,
          auctionId: auctionId,
        });
      }
      // --- FIN DE LA MODIFICACIÓN ---

      return newBid;
    });
  }

  async findBidsByUser(userId: number) {
    return this.bidRepo.find({
      where: { user_id: userId },
      // Con 'relations' nos aseguramos de traer la información completa
      relations: {
        auction: {
          product: true, // Dentro de la subasta, carga el producto
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  // --- INICIO DE LA MODIFICACIÓN: Nuevo método para cerrar subastas ---
  async closeAuction(auctionId: number) {
    const auction = await this.auctionRepo.findOne({
      where: { id: auctionId, status: 'active' },
      relations: ['product', 'bids'], // Cargamos producto y todas las pujas
    });

    if (!auction) throw new NotFoundException('Subasta activa no encontrada.');
    if (new Date() < auction.end_time)
      throw new BadRequestException('La subasta aún no ha finalizado.');

    const winningBid = await this.bidRepo.findOne({
      where: { auction: { id: auctionId } },
      order: { amount: 'DESC' },
    });

    const seller = await this.userRepo.findOneBy({
      id: auction.product.owner_id,
    });

    if (winningBid && seller) {
      const winner = await this.userRepo.findOneBy({ id: winningBid.user_id });
      if (winner) {
        auction.status = 'finished'; // Cambiamos el estado
        auction.winner_id = winner.id; // Guardamos el ID del ganador
        await this.auctionRepo.save(auction);

        // Emitimos el evento para notificar al ganador y al vendedor
        this.emailClient.emit('auction_closed', {
          productName: auction.product.name,
          sellerEmail: seller.email,
          sellerName: seller.nombre,
          winnerEmail: winner.email,
          winnerName: winner.nombre,
          winningAmount: winningBid.amount,
          auctionId: auctionId,
        });
      }
    } else {
      // Si no hay pujas, simplemente se cierra
      auction.status = 'finished';
      await this.auctionRepo.save(auction);
    }
    return auction;
  }
  // --- FIN DE LA MODIFICACIÓN ---

  // NUEVO MÉTODO: Encuentra todas las subastas creadas por un usuario específico.
  async findByOwner(ownerId: number) {
    return this.auctionRepo.find({
      // Buscamos donde la relación 'product' tenga un 'owner_id' que coincida.
      where: { product: { owner_id: ownerId } },
      relations: ['product'], // Nos aseguramos de incluir los datos del producto.
      order: { created_at: 'DESC' }, // Ordenamos por las más recientes primero.
    });
  }

  async findAllActive() {
    return this.auctionRepo.find({
      where: { status: 'active' },
      relations: ['product'],
    });
  }

  async findOne(id: number) {
    const auction = await this.auctionRepo.findOne({
      where: { id },
      relations: ['product', 'bids'],
    });
    if (!auction) {
      throw new NotFoundException(`Subasta con ID ${id} no encontrada.`);
    }
    return auction;
  }
}
