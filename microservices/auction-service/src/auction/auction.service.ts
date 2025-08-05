import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { AuctionGateway } from './auction.gateway';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';

@Injectable()
export class AuctionService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Auction) private auctionRepo: Repository<Auction>,
    @InjectRepository(Bid) private bidRepo: Repository<Bid>,
    private readonly auctionGateway: AuctionGateway,
    private readonly dataSource: DataSource,
  ) { }

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

    await this.auctionRepo.save(auction);
    return auction;
  }

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

  async placeBid(auctionId: number, dto: PlaceBidDto, user: any) {
    return this.dataSource.transaction(async transactionalEntityManager => {
      const auctionRepo = transactionalEntityManager.getRepository(Auction);
      const productRepo = transactionalEntityManager.getRepository(Product);
      const bidRepo = transactionalEntityManager.getRepository(Bid);

      const auction = await auctionRepo.findOne({ where: { id: auctionId }, relations: ['product'] });
      if (!auction) throw new NotFoundException('Subasta no encontrada.');
      if (auction.status !== 'active') throw new BadRequestException('La subasta no está activa.');
      if (new Date() > auction.end_time) throw new BadRequestException('La subasta ha finalizado.');
      if (dto.amount <= auction.current_price) throw new BadRequestException('La puja debe ser mayor al precio actual.');

      // CORRECCIÓN: Verificamos que el producto exista antes de acceder a sus propiedades
      if (!auction.product) throw new NotFoundException('El producto asociado a esta subasta no fue encontrado.');
      if (auction.product.owner_id === user.userId) throw new ForbiddenException('No puedes pujar en tu propia subasta.');

      const newBid = bidRepo.create({
        amount: dto.amount,
        user_id: user.userId,
        auction: auction,
      });
      await bidRepo.save(newBid);

      auction.current_price = dto.amount;
      await auctionRepo.save(auction);

      this.auctionGateway.emitNewBid(auctionId, newBid, { name: user.name });
      this.auctionGateway.emitPriceUpdate(auctionId, auction.current_price);

      return newBid;
    });
  }
}
