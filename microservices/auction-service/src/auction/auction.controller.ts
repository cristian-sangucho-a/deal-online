import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @UseGuards(AuthGuard) // Protege esta ruta
  @Post()
  create(@Body() createAuctionDto: CreateAuctionDto, @CurrentUser() user: any) {
    return this.auctionService.createAuction(createAuctionDto, user);
  }

  @Get()
  findAll() {
    return this.auctionService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auctionService.findOne(id);
  }

  @UseGuards(AuthGuard) // Protege esta ruta
  @Post(':id/bids')
  placeBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() placeBidDto: PlaceBidDto,
    @CurrentUser() user: any,
  ) {
    return this.auctionService.placeBid(id, placeBidDto, user);
  }
}