import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Session from '../models/Session.js';
import generateToken from '../utils/generateToken.js';
import { generateVerificationCode } from '../utils/generateVerificationCode.js';
import emailService from './emailService.js';
import { CustomError } from '../utils/customError.js';

class AuthService {
    async register(nombre, email, password, celular) {
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            if (existingUser.is_verified) {
                throw new CustomError('El correo ya está registrado y verificado', 400);
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await existingUser.update({
                password_hash: passwordHash,
                nombre,
                role: 'client',
                celular,
                verification_code: verificationCode,
                verification_code_expires: expiresAt,
                updated_at: new Date(),
            });

            await emailService.sendVerificationEmail(email, verificationCode);

            return { user: existingUser, message: 'Se ha enviado un nuevo código de verificación a tu correo' };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const user = await User.create({
            nombre,
            email,
            password_hash: passwordHash,
            role: 'client',
            celular,
            verification_code: verificationCode,
            verification_code_expires: expiresAt,
            is_verified: false,
        });

        await emailService.sendVerificationEmail(email, verificationCode);

        return { user, message: 'Se ha enviado un código de verificación a tu correo' };
    }

    async resendVerificationCode(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 404);

        if (user.is_verified) throw new CustomError('El usuario ya está verificado', 400);

        const newVerificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await user.update({
            verification_code: newVerificationCode,
            verification_code_expires: expiresAt,
        });

        await emailService.sendVerificationEmail(email, newVerificationCode);

        return { message: 'Se ha reenviado un nuevo código de verificación a tu correo' };
    }

    async verifyRegistration(email, verificationCode) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 404);

        if (user.is_verified) throw new CustomError('El usuario ya está verificado', 400);

        if (user.verification_code !== verificationCode) {
            throw new CustomError('Código de verificación incorrecto', 400);
        }

        const now = new Date();
        if (user.verification_code_expires < now) {
            await user.update({
                verification_code: null,
                verification_code_expires: null,
            });
            throw new CustomError('El código de verificación ha expirado. Por favor, solicita uno nuevo.', 400);
        }

        // Marcar como verificado y limpiar el código y tiempo de expiración
        await user.update({
            is_verified: true,
            verification_code: null,
            verification_code_expires: null,
        });

        const token = generateToken(user.id, user.email, user.nombre, user.role);
        await Session.create({
            user_id: user.id,
            token,
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return { user, token };
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 401);

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) throw new CustomError('Contraseña incorrecta', 401);

        if (!user.is_verified) throw new CustomError('Por favor, verifica tu cuenta primero', 403);

        const token = generateToken(user.id, user.email, user.nombre, user.role);
        await Session.create({
            user_id: user.id,
            token,
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return { user, token };
    }

    async refreshToken(oldToken) {
        try {
            const session = await Session.findOne({
                where: { token: oldToken },
                include: [{ model: User }],
            });

            if (!session || session.expires_at < new Date()) {
                if (session) await session.destroy();
                throw new CustomError('Sesión inválida o expirada', 401);
            }

            const timeLeft = session.expires_at - new Date();
            if (timeLeft > 5 * 60 * 1000) {
                return {
                    token: oldToken,
                    user: {
                        id: session.User.id,
                        nombre: session.User.nombre,
                        email: session.User.email,
                        celular: session.User.celular,
                        role: session.User.role,
                    },
                };
            }

            const newToken = generateToken(
                session.User.id,
                session.User.email,
                session.User.nombre,
                session.User.role
            );
            const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            session.token = newToken;
            session.issued_at = new Date();
            session.expires_at = newExpiresAt;
            await session.save();

            return {
                token: newToken,
                user: {
                    id: session.User.id,
                    nombre: session.User.nombre,
                    email: session.User.email,
                    celular: session.User.celular,
                    role: session.User.role,
                },
            };
        } catch (error) {
            throw new CustomError('Token inválido o expirado', 401);
        }
    }

    async logout(token) {
        const session = await Session.findOne({ where: { token } });
        if (!session) throw new CustomError('Sesión no encontrada', 404);

        await session.destroy();
        return { message: 'Sesión cerrada exitosamente' };
    }

    async requestPasswordReset(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 404);
        if (!user.is_verified) throw new CustomError('El usuario no está verificado', 403);

        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await user.update({
            verification_code: verificationCode,
            verification_code_expires: expiresAt,
        });

        await emailService.sendPasswordResetEmail(email, verificationCode);
        return { message: 'Se ha enviado un código de verificación a tu correo para restablecer la contraseña' };
    }

    async verifyResetCode(email, verificationCode) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 404);

        if (user.verification_code !== verificationCode) {
            throw new CustomError('Código de verificación incorrecto', 400);
        }

        const now = new Date();
        if (user.verification_code_expires < now) {
            await user.update({
                verification_code: null,
                verification_code_expires: null,
            });
            throw new CustomError('El código de verificación ha expirado. Por favor, solicita uno nuevo.', 400);
        }

        return { message: 'Código de verificación válido' };
    }

    async resetPassword(email, verificationCode, newPassword) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new CustomError('Usuario no encontrado', 404);

        if (user.verification_code !== verificationCode) {
            throw new CustomError('Código de verificación incorrecto', 400);
        }

        const now = new Date();
        if (user.verification_code_expires < now) {
            await user.update({
                verification_code: null,
                verification_code_expires: null,
            });
            throw new CustomError('El código de verificación ha expirado. Por favor, solicita uno nuevo.', 400);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await user.update({
            password_hash: passwordHash,
            verification_code: null,
            verification_code_expires: null,
        });

        await Session.destroy({ where: { user_id: user.id } });
        return { message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña.' };
    }
}

export default new AuthService();