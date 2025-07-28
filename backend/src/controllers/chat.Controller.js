import ChatService from '../services/chatService.js';
import { handleHttpError } from '../utils/errorHandler.js';
import { verifyToken } from '../utils/jwt.js';

export const sendMessage = async (req, res) => {
    try {
        const { auction_id, message, is_bid, bid_amount } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        if (!auction_id || !message) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('ID de subasta y mensaje requeridos'), 400);
        }

        const chatMessage = await ChatService.sendMessage(decoded.id, auction_id, message, is_bid, bid_amount);
        res.status(201).json({ message: 'Mensaje enviado exitosamente', chatMessage });
    } catch (error) {
        handleHttpError(res, 'SEND_MESSAGE_ERROR', error, error.status || 500);
    }
};

export const getMessages = async (req, res) => {
    try {
        const { auction_id } = req.params;
        const messages = await ChatService.getMessages(auction_id);
        res.status(200).json(messages);
    } catch (error) {
        handleHttpError(res, 'GET_MESSAGES_ERROR', error, error.status || 500);
    }
};