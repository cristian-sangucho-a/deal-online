import { IsNumber, IsPositive } from 'class-validator';
export class PlaceBidDto {
  @IsNumber()
  @IsPositive({ message: 'El monto de la puja debe ser positivo.' })
  amount: number;
}