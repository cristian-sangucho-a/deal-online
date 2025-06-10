import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';
import { CustomError } from '../utils/customError.js';
import emailService from './emailService.js';

class AuctionService {
    async createProduct(userId, { name, description, starting_price, image_url, end_time }) {
        const product = await Product.create({
            name,
            description,
            starting_price,
            image_url,
            user_id: userId,
        });

        const auction = await Auction.create({
            product_id: product.id,
            start_time: new Date(),
            end_time: new Date(end_time),
            current_price: starting_price,
        });

        const users = await User.findAll({ where: { is_verified: true } });
        for (const user of users) {
            await emailService.sendNewAuctionNotification(user.email, auction.id, product.name);
        }

        return { product, auction };
    }

    async getAllProducts() {
        return await Product.findAll({
            include: [
                { model: User, as: 'seller', attributes: ['id', 'nombre', 'email'] },
                { 
                    model: Auction, 
                    as: 'auction', 
                    attributes: ['id', 'status', 'current_price', 'end_time', 'winning_bid_id'],
                    include: [{ 
                        model: Bid, 
                        as: 'winning_bid', 
                        include: [{ model: User, as: 'bidder' }] 
                    }] 
                },
            ],
        });
    }

    async getProductById(productId) {
        const product = await Product.findByPk(productId, {
            include: [
                { model: User, as: 'seller', attributes: ['id', 'nombre', 'email'] },
                { 
                    model: Auction, 
                    as: 'auction',
                    include: [
                        { 
                            model: Bid, 
                            as: 'bids',
                            include: [{ model: User, as: 'bidder' }]
                        },
                        {
                            model: Bid,
                            as: 'winning_bid',
                            include: [{ model: User, as: 'bidder' }]
                        }
                    ]
                },
            ],
        });
        if (!product) throw new CustomError('Producto no encontrado', 404);
        return product;
    }

    async updateProduct(userId, productId, { name, description, image_url }) {
        const product = await Product.findByPk(productId);
        if (!product) throw new CustomError('Producto no encontrado', 404);
        if (product.user_id !== userId) throw new CustomError('No tienes permiso para editar este producto', 403);

        await product.update({ name, description, image_url });
        return product;
    }

    async deleteProduct(userId, productId) {
        const product = await Product.findByPk(productId);
        if (!product) throw new CustomError('Producto no encontrado', 404);
        if (product.user_id !== userId) throw new CustomError('No tienes permiso para eliminar este producto', 403);

        const auction = await Auction.findOne({ where: { product_id: productId } });
        if (auction) {
            if (auction.status === 'active') {
                await auction.update({ status: 'cancelled' });
            }
            await auction.destroy();
        }
        await product.destroy();
        return { message: 'Producto y subasta eliminados exitosamente' };
    }

    async placeBid(userId, auctionId, amount, message = '') {
        const auction = await Auction.findByPk(auctionId, {
            include: [{ model: Product, as: 'product' }],
        });
        if (!auction) throw new CustomError('Subasta no encontrada', 404);
        if (auction.status !== 'active') throw new CustomError('La subasta no está activa', 400);
        if (new Date() > auction.end_time) throw new CustomError('La subasta ha finalizado', 400);
        if (amount <= auction.current_price) throw new CustomError('La oferta debe ser mayor que el precio actual', 400);

        const user = await User.findByPk(userId);
        if (!user) throw new CustomError('Usuario no encontrado', 404);
        const bid = await Bid.create({
            auction_id: auctionId,
            user_id: userId,
            amount,
        });

        await auction.update({ current_price: amount });

        const users = await User.findAll({ where: { is_verified: true } });
        for (const user of users) {
            if (user.id !== userId) {
                await emailService.sendBidNotification(user.email, auction.id, auction.product.name, amount, user.nombre);
            }
        }

        return { bid, auction };
    }

    async closeAuction(auctionId) {
        const auction = await Auction.findByPk(auctionId, {
            include: [
                { model: Product, as: 'product', include: [{ model: User, as: 'seller' }] },
                { model: Bid, as: 'bids', include: [{ model: User, as: 'bidder' }], order: [['amount', 'DESC']] },
            ],
        });
        if (!auction) throw new CustomError('Subasta no encontrada', 404);
        if (auction.status !== 'active') throw new CustomError('La subasta ya está cerrada o cancelada', 400);

        let winningBid = null;
        if (auction.bids && auction.bids.length > 0) {
            winningBid = auction.bids[0];
            await auction.update({ winning_bid_id: winningBid.id, status: 'closed' });
        } else {
            await auction.update({ status: 'closed' });
        }

        if (winningBid) {
            const winner = winningBid.bidder;
            const seller = auction.product.seller;
            await emailService.sendAuctionClosedNotification(winner.email, auction.id, auction.product.name, true, winningBid.amount);
            await emailService.sendAuctionClosedNotification(seller.email, auction.id, auction.product.name, false, winningBid.amount);
        }

        return { auction, winningBid };
    }
}

export default new AuctionService();