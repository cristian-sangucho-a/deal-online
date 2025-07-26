import { Injectable, Inject, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  private generateVerificationCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, name: user.nombre, role: user.role };
    return this.jwtService.sign(payload);
  }

  async register(registerDto: RegisterDto) {
    let user = await this.usersRepository.findOneBy({ email: registerDto.email });
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (user) {
      if (user.is_verified) {
        throw new ConflictException('El correo ya está registrado y verificado.');
      }
      user.nombre = registerDto.nombre;
      user.password_hash = await bcrypt.hash(registerDto.password, 10);
      // --- CORRECCIÓN ---
      // Ahora esta línea es válida porque la propiedad 'celular' en User puede ser 'string | null'
      user.celular = registerDto.celular || null;
      user.verification_code = verificationCode;
      user.verification_code_expires = expiresAt;
    } else {
      user = this.usersRepository.create({
        ...registerDto,
        password_hash: registerDto.password,
        verification_code: verificationCode,
        verification_code_expires: expiresAt,
      });
    }
    
    await this.usersRepository.save(user);

    this.emailClient.emit('user_registered', {
      email: user.email,
      name: user.nombre,
      code: verificationCode,
    });

    return { message: 'Registro exitoso. Se ha enviado un código de verificación a tu correo.' };
  }
  
  async verifyRegistration(verifyDto: VerifyDto) {
    const { email, code } = verifyDto;
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.is_verified) throw new BadRequestException('El usuario ya está verificado.');
    
    // CORRECCIÓN: Verificamos que el código de expiración no sea null antes de compararlo.
    if (!user.verification_code_expires || new Date() > user.verification_code_expires || user.verification_code !== code) {
      throw new BadRequestException('Código de verificación inválido o expirado.');
    }

    user.is_verified = true;
    user.verification_code = null;
    user.verification_code_expires = null;
    await this.usersRepository.save(user);
    
    const accessToken = this.generateToken(user);
    
    return {
      message: 'Cuenta verificada exitosamente.',
      accessToken,
      user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersRepository.findOneBy({ email });
    
    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    if (!user.is_verified) {
      throw new UnauthorizedException('La cuenta no ha sido verificada.');
    }
    
    const accessToken = this.generateToken(user);
    return {
      accessToken,
      user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role },
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
      const user = await this.usersRepository.findOneBy({ email: dto.email });
      if (!user) {
        // No lanzamos error para no revelar si un email existe o no
        return { message: 'Si existe una cuenta con este correo, se ha enviado un código de restablecimiento.' };
      }

      if (!user.is_verified) throw new BadRequestException('La cuenta no ha sido verificada.');
      
      const verificationCode = this.generateVerificationCode();
      user.verification_code = verificationCode;
      user.verification_code_expires = new Date(Date.now() + 15 * 60 * 1000);
      await this.usersRepository.save(user);

      this.emailClient.emit('password_reset_request', {
          email: user.email,
          name: user.nombre,
          code: verificationCode,
      });

      return { message: 'Si existe una cuenta con este correo, se ha enviado un código de restablecimiento.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
      const { email, code, password } = dto;
      const user = await this.usersRepository.findOneBy({ email });

      if (!user) throw new NotFoundException('Usuario no encontrado.');
      
      // CORRECCIÓN: Verificamos que el código de expiración no sea null antes de compararlo.
      if (!user.verification_code_expires || new Date() > user.verification_code_expires || user.verification_code !== code) {
          throw new BadRequestException('Código de restablecimiento inválido o expirado.');
      }
      
      user.password_hash = await bcrypt.hash(password, 10);
      user.verification_code = null;
      user.verification_code_expires = null;
      await this.usersRepository.save(user);

      return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
}
