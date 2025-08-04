import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { UserEventPayloadDto } from './dto/user-event-payload.dto';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {}

  // Este hook se ejecuta una vez que el módulo se ha inicializado.
  async onModuleInit() {
    try {
      // Configuración correcta para Gmail usando las variables de entorno de Cloud Run
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // ✅ CORRECTO: No 127.0.0.1
        port: 587,
        secure: false, // true para puerto 465, false para otros puertos
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
        tls: {
          rejectUnauthorized: false, // Para evitar problemas SSL en Cloud Run
        },
      });

      // Verificar la conexión
      await this.transporter.verify();
      console.log('✅ Conexión SMTP configurada correctamente para Gmail');
    } catch (error) {
      console.error('❌ Error al conectar con el servidor SMTP de Gmail:', error);
      // No lanzar error para que el servicio pueda iniciar
    }
  }

  async sendVerificationEmail(payload: UserEventPayloadDto) {
    const { email, name, code } = payload;
    const subject = 'Verifica tu cuenta en Deal Online';
    const html = `
      <h1>¡Bienvenido a Deal Online, ${name}!</h1>
      <p>Gracias por registrarte. Por favor, usa el siguiente código para verificar tu cuenta:</p>
      <h2 style="font-family: monospace; font-size: 2em; letter-spacing: 4px;">${code}</h2>
      <p>Este código expirará en 15 minutos.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(payload: UserEventPayloadDto) {
    const { email, name, code } = payload;
    const subject = 'Restablecimiento de contraseña para Deal Online';
    const html = `
      <h1>Hola, ${name}</h1>
      <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
      <h2 style="font-family: monospace; font-size: 2em; letter-spacing: 4px;">${code}</h2>
      <p>Si no solicitaste esto, puedes ignorar este correo. El código expirará en 15 minutos.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const fromEmail = this.configService.get<string>('EMAIL_USER');
      const fromName = 'Deal Online';

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email enviado a ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error);
      throw error; // Lanza el error para que el controller pueda manejar el `nack`.
    }
  }
}
