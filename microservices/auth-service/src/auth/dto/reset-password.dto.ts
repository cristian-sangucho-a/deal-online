import { IsEmail, IsString, MinLength, Length } from 'class-validator';
export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
  code: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  password: string;
}