import { IsEmail, IsString, Length } from 'class-validator';
export class VerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
  code: string;
}