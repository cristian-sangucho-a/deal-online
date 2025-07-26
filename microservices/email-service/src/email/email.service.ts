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
    // Leemos las nuevas variables de entorno para SMTP
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const secure = this.configService.get<boolean>('SMTP_SECURE');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    // Creamos el transportador de Nodemailer con la configuración de Gmail
    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure, // true para el puerto 465
      auth: {
        user: user, // tu.correo@gmail.com
        pass: pass, // La contraseña de aplicación de 16 dígitos
      },
    });

    // Verificamos que la conexión SMTP funcione
    try {
      await this.transporter.verify();
      console.log('✅ Servidor SMTP de Gmail conectado y listo para enviar correos.');
    } catch (error) {
      console.error('❌ Error al conectar con el servidor SMTP de Gmail:', error);
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
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME');
    const fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS');

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: to,
      subject: subject,
      html: html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email enviado a ${to}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error(`❌ Error al enviar email a ${to}:`, error);
      throw error; // Lanza el error para que el controller pueda manejar el `nack`.
    }
  }
}
