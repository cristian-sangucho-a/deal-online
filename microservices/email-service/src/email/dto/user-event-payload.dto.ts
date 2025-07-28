import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class UserEventPayloadDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
  code: string;
}
