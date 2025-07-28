import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

//Configurar transporter para nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

class EmailService {
    async sendEmail(to, subject, html) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de verificación enviado a ${to}`);
        } catch (error) {
            console.error('Error al enviar el correo de verificación:', error);
            throw new Error('No se pudo enviar el correo de verificación');
        }
    }
    
    async sendVerificationEmail(toEmail, verificationCode) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Código de Verificación - Deal Online',
            text: `Tu código de verificación es: ${verificationCode}. Válido por 15 minutos.`,
            html: `
                <h2>Verificación de Cuenta - Deal Online</h2>
                <p>¡Bienvenido a Deal Online, tu plataforma de subastas en línea!</p>
                <p>Tu código de verificación es: <strong>${verificationCode}</strong></p>
                <p>Este código es válido por 15 minutos. Ingresa este código en la página de verificación para completar tu registro y empezar a participar en nuestras subastas.</p>
                <p>Si no solicitaste este código, ignora este mensaje.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de verificación enviado a ${toEmail}`);
        } catch (error) {
            console.error('Error al enviar el correo de verificación:', error);
            throw new Error('No se pudo enviar el correo de verificación');
        }
    }

    async sendPasswordResetEmail(toEmail, verificationCode) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Restablecer Contraseña - Deal Online',
            text: `Tu código para restablecer la contraseña es: ${verificationCode}. Válido por 15 minutos.`,
            html: `
                <h2>Restablecimiento de Contraseña - Deal Online</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Deal Online.</p>
                <p>Tu código de verificación es: <strong>${verificationCode}</strong></p>
                <p>Este código es válido por 15 minutos. Ingresa este código en la página de restablecimiento de contraseña para continuar.</p>
                <p>Si no solicitaste este código, ignora este mensaje o contacta con nuestro soporte.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de restablecimiento de contraseña enviado a ${toEmail}`);
        } catch (error) {
            console.error('Error al enviar el correo de restablecimiento:', error);
            throw new Error('No se pudo enviar el correo de restablecimiento de contraseña');
        }
    }

    async sendNewAuctionNotification(toEmail, auctionId, productName) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: `Nueva Subasta Creada: ${productName} - Deal Online`,
            text: `Se ha creado una nueva subasta para el producto "${productName}". ¡Únete ahora y haz tu oferta!`,
            html: `
                <h2>Nueva Subasta en Deal Online</h2>
                <p>¡Una nueva subasta ha sido creada para el producto <strong>${productName}</strong>!</p>
                <p>Ingresa a Deal Online para participar en la subasta y realizar tus ofertas en tiempo real.</p>
                <p><a href="https://Deal Online.com/auctions/${auctionId}">Ver subasta</a></p>
                <p>Si no deseas recibir estas notificaciones, puedes ajustar tus preferencias en tu perfil.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de notificación de nueva subasta enviado a ${toEmail}`);
        } catch (error) {
            console.error('Error al enviar el correo de notificación de subasta:', error);
            throw new Error('No se pudo enviar el correo de notificación de subasta');
        }
    }

    async sendBidNotification(toEmail, auctionId, productName, bidAmount, bidderName) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: `Nueva Oferta en ${productName} - Deal Online`,
            text: `Se ha realizado una nueva oferta de ${bidAmount} por el producto "${productName}" por el usuario ${bidderName}.`,
            html: `
                <h2>Nueva Oferta en Deal Online</h2>
                <p>El usuario <strong>${bidderName}</strong> ha realizado una oferta de <strong>${bidAmount}</strong> por el producto <strong>${productName}</strong>.</p>
                <p>¡Ingresa ahora para hacer una contraoferta y no perder esta oportunidad!</p>
                <p><a href="https://Deal Online.com/auctions/${auctionId}">Ver subasta</a></p>
                <p>Si no deseas recibir estas notificaciones, puedes ajustar tus preferencias en tu perfil.</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de notificación de oferta enviado a ${toEmail}`);
        } catch (error) {
            console.error('Error al enviar el correo de notificación de oferta:', error);
            throw new Error('No se pudo enviar el correo de notificación de oferta');
        }
    }

    async sendAuctionClosedNotification(toEmail, auctionId, productName, isWinner, winningAmount) {
        const subject = isWinner ? `¡Ganaste la subasta de ${productName}!` : `Subasta cerrada: ${productName}`;
        const text = isWinner
            ? `¡Felicidades! Has ganado la subasta del producto "${productName}" con una oferta de ${winningAmount}.`
            : `La subasta del producto "${productName}" ha finalizado con una oferta ganadora de ${winningAmount}.`;
        const html = isWinner
            ? `
                <h2>¡Ganaste la subasta en Deal Online!</h2>
                <p>¡Felicidades! Has ganado la subasta del producto <strong>${productName}</strong> con una oferta de <strong>${winningAmount}</strong>.</p>
                <p>Contacta al vendedor para coordinar la entrega. Puedes ver los detalles en la subasta.</p>
                <p><a href="https://Deal Online.com/auctions/${auctionId}">Ver subasta</a></p>
            `
            : `
                <h2>Subasta cerrada en Deal Online</h2>
                <p>La subasta del producto <strong>${productName}</strong> ha finalizado con una oferta ganadora de <strong>${winningAmount}</strong>.</p>
                <p>Puedes ver los detalles en la subasta o crear una nueva.</p>
                <p><a href="https://Deal Online.com/auctions/${auctionId}">Ver subasta</a></p>
            `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject,
            text,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Correo de notificación de subasta cerrada enviado a ${toEmail}`);
        } catch (error) {
            console.error('Error al enviar el correo de notificación de subasta cerrada:', error);
            throw new Error('No se pudo enviar el correo de notificación de subasta cerrada');
        }
    }
};

export default new EmailService();