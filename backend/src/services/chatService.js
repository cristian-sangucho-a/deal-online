import ChatMessage from '../models/ChatMessage.js';
import Auction from '../models/Auction.js';
import { CustomError } from '../utils/customError.js';
import auctionService from './auctionService.js';

class ChatService {
    async sendMessage(userId, auctionId, message, isBid = false, bidAmount = null) {
        const auction = await Auction.findByPk(auctionId);
        if (!auction) throw new CustomError('Subasta no encontrada', 404);
        if (auction.status !== 'active') throw new CustomError('La subasta no está activa', 400);
        if (isBid && (!bidAmount || bidAmount <= auction.current_price)) {
            throw new CustomError('La oferta debe ser mayor que el precio actual', 400);
        }

        const chatMessage = await ChatMessage.create({
            auction_id: auctionId,
            user_id: userId,
            message,
            is_bid: isBid,
            bid_amount: isBid ? bidAmount : null,
        });

        if (isBid) {
            await auctionService.placeBid(userId, auctionId, bidAmount, message);
        }

        return chatMessage;
    }

    async getMessages(auctionId) {
        const auction = await Auction.findByPk(auctionId);
        if (!auction) throw new CustomError('Subasta no encontrada', 404);

        return await ChatMessage.findAll({
            where: { auction_id: auctionId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'nombre', 'profile_picture'] }],
            order: [['created_at', 'ASC']],
        });
    }
}

export default new ChatService();