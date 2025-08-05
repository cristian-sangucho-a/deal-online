// src/dto/new-bid-payload.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class NewBidPayloadDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsEmail()
  productOwnerEmail: string;

  @IsString()
  @IsNotEmpty()
  productOwnerName: string;

  @IsNumber()
  bidAmount: number;

  @IsString()
  @IsNotEmpty()
  bidderName: string;

  @IsNumber()
  auctionId: number;
}
