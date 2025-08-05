// auction.controller.ts

import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createAuctionDto: CreateAuctionDto, @CurrentUser() user: any) {
    if (!user) {
      throw new UnauthorizedException('No se encontró la información del usuario en la petición.');
    }
    return this.auctionService.createAuction(createAuctionDto, user);
  }

  @Get()
  findAll() {
    return this.auctionService.findAllActive();
  }

  @UseGuards(AuthGuard)
  @Get('my-auctions')
  findMyAuctions(@CurrentUser() user: any) {
    // --- INICIO DE LA CORRECCIÓN ---
    // Añadimos una comprobación para asegurarnos de que el payload del usuario existe.
    if (!user || !user.userId) {
      throw new UnauthorizedException('No se encontró la información del usuario en la petición.');
    }
    // --- FIN DE LA CORRECCIÓN ---
    return this.auctionService.findByOwner(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auctionService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/bids')
  placeBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() placeBidDto: PlaceBidDto,
    @CurrentUser() user: any,
  ) {
    if (!user) {
      throw new UnauthorizedException('No se encontró la información del usuario en la petición.');
    }
    return this.auctionService.placeBid(id, placeBidDto, user);
  }
}
