import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsUrl } from 'class-validator';
export class CreateAuctionDto {
  @IsString() @IsNotEmpty()
  productName: string;

  @IsString() @IsNotEmpty()
  productDescription: string;

  @IsUrl()
  imageUrl: string;

  @IsNumber() @IsPositive()
  startPrice: number;

  @IsDateString()
  endTime: Date;
}