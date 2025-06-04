import AuthService from '../services/authService.js';
import { handleHttpError } from '../utils/errorHandler.js';

// Registro
export const register = async (req, res) => {
    try {
        const { nombre, email, password, celular } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !email || !password || !celular) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Todos los campos son requeridos'), 400);
        }

        // Validar formato básico del email
        if (!email.includes('@')) {
            return handleHttpError(res, 'INVALID_EMAIL', new Error('Email inválido'), 400);
        }

        // Llamar al servicio para registrar el usuario
        const { user, message } = await AuthService.register(nombre, email, password, celular);

        res.status(201).json({
            message,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                celular: user.celular
            }
        });
    } catch (error) {
        handleHttpError(res, 'REGISTER_ERROR', error, error.status || 500);
    }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        // Validar que el email esté presente
        if (!email) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email requerido'), 400);
        }

        // Llamar al servicio para reenviar el código
        const { message } = await AuthService.resendVerificationCode(email);
        res.status(200).json({ message });
    } catch (error) {
        handleHttpError(res, 'RESEND_CODE_ERROR', error, error.status || 500);
    }
};

// Verificar registro
export const verifyRegistration = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!email || !verificationCode) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email y código de verificación requeridos'), 400);
        }

        // Llamar al servicio para verificar el registro
        const { user, token } = await AuthService.verifyRegistration(email, verificationCode);
        res.status(200).json({
            message: 'Usuario verificado exitosamente',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                celular: user.celular
            },
            token
        });
    } catch (error) {
        handleHttpError(res, 'VERIFY_ERROR', error, error.status || 500);
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!email || !password) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email y contraseña requeridos'), 400);
        }

        // Llamar al servicio para iniciar sesión
        const { user, token } = await AuthService.login(email, password);
        res.status(200).json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                celular: user.celular
            },
            token
        });
    } catch (error) {
        handleHttpError(res, 'LOGIN_ERROR', error, error.status || 500);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            throw new CustomError('Token no proporcionado', 400);
        }
        const { token: newToken, user } = await authService.refreshToken(token);
        res.status(200).json({
            success: true,
            data: { token: newToken, user },
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Token requerido'), 400);
        }

        const { message } = await AuthService.logout(token);
        res.status(200).json({ message });
    } catch (error) {
        handleHttpError(res, 'LOGOUT_ERROR', error, error.status || 500);
    }
};

// Solicitar restablecimiento de contraseña
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email requerido'), 400);
        }
        if (!email.includes('@')) {
            return handleHttpError(res, 'INVALID_EMAIL', new Error('Email inválido'), 400);
        }
        const { message } = await AuthService.requestPasswordReset(email);
        res.status(200).json({ message });
    } catch (error) {
        handleHttpError(res, 'REQUEST_PASSWORD_RESET_ERROR', error, error.status || 500);
    }
};

// Verificar código de restablecimiento
export const verifyResetCode = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        if (!email || !verificationCode) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email y código de verificación requeridos'), 400);
        }
        if (!email.includes('@')) {
            return handleHttpError(res, 'INVALID_EMAIL', new Error('Email inválido'), 400);
        }
        const { message } = await AuthService.verifyResetCode(email, verificationCode);
        res.status(200).json({ message });
    } catch (error) {
        handleHttpError(res, 'VERIFY_RESET_CODE_ERROR', error, error.status || 500);
    }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
    try {
        const { email, verificationCode, newPassword } = req.body;
        if (!email || !verificationCode || !newPassword) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Email, código de verificación y nueva contraseña requeridos'), 400);
        }
        if (!email.includes('@')) {
            return handleHttpError(res, 'INVALID_EMAIL', new Error('Email inválido'), 400);
        }
        if (newPassword.length < 6) {
            return handleHttpError(res, 'INVALID_PASSWORD', new Error('La contraseña debe tener al menos 6 caracteres'), 400);
        }
        const { message } = await AuthService.resetPassword(email, verificationCode, newPassword);
        res.status(200).json({ message });
    } catch (error) {
        handleHttpError(res, 'RESET_PASSWORD_ERROR', error, error.status || 500);
    }
};