import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  auctionId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
