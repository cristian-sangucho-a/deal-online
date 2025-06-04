import { Router } from 'express';
import { register, resendVerificationCode, verifyRegistration, login, logout, requestPasswordReset, resetPassword, verifyResetCode, refreshToken } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/resend-verification', resendVerificationCode);
router.post('/verify', verifyRegistration);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;