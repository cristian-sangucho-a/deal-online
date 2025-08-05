// src/dto/auction-closed-payload.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class AuctionClosedPayloadDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsEmail()
  sellerEmail: string;

  @IsString()
  @IsNotEmpty()
  sellerName: string;

  @IsEmail()
  winnerEmail: string;

  @IsString()
  @IsNotEmpty()
  winnerName: string;

  @IsNumber()
  winningAmount: number;

  @IsNumber()
  auctionId: number;
}
