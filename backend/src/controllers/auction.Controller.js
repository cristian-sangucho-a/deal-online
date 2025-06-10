import AuctionService from '../services/auctionService.js';
import { handleHttpError } from '../utils/errorHandler.js';
import { verifyToken } from '../utils/jwt.js';

export const createProduct = async (req, res) => {
    try {
        const { name, description, starting_price, image_url, end_time } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        if (!name || !starting_price || !end_time) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('Nombre, precio inicial y fecha de finalización requeridos'), 400);
        }

        const { product, auction } = await AuctionService.createProduct(decoded.id, {
            name,
            description,
            starting_price,
            image_url,
            end_time,
        });

        res.status(201).json({ message: 'Producto y subasta creados exitosamente', product, auction });
    } catch (error) {
        handleHttpError(res, 'CREATE_PRODUCT_ERROR', error, error.status || 500);
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await AuctionService.getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        handleHttpError(res, 'GET_PRODUCTS_ERROR', error, error.status || 500);
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await AuctionService.getProductById(id);
        res.status(200).json(product);
    } catch (error) {
        handleHttpError(res, 'GET_PRODUCT_ERROR', error, error.status || 500);
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image_url } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        const product = await AuctionService.updateProduct(decoded.id, id, { name, description, image_url });
        res.status(200).json({ message: 'Producto actualizado exitosamente', product });
    } catch (error) {
        handleHttpError(res, 'UPDATE_PRODUCT_ERROR', error, error.status || 500);
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        const result = await AuctionService.deleteProduct(decoded.id, id);
        res.status(200).json(result);
    } catch (error) {
        handleHttpError(res, 'DELETE_PRODUCT_ERROR', error, error.status || 500);
    }
};

export const placeBid = async (req, res) => {
    try {
        const { auction_id, amount, message } = req.body;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        if (!auction_id || !amount) {
            return handleHttpError(res, 'BAD_REQUEST', new Error('ID de subasta y monto requeridos'), 400);
        }

        const { bid, auction } = await AuctionService.placeBid(decoded.id, auction_id, amount, message);
        res.status(201).json({ message: 'Oferta realizada exitosamente', bid, auction });
    } catch (error) {
        handleHttpError(res, 'PLACE_BID_ERROR', error, error.status || 500);
    }
};

export const closeAuction = async (req, res) => {
    try {
        const { auction_id } = req.params;
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return handleHttpError(res, 'UNAUTHORIZED', new Error('Token requerido'), 401);

        const decoded = verifyToken(token);
        const { auction, winningBid } = await AuctionService.closeAuction(auction_id, decoded.id);
        res.status(200).json({ message: 'Subasta cerrada exitosamente', auction, winningBid });
    } catch (error) {
        handleHttpError(res, 'CLOSE_AUCTION_ERROR', error, error.status || 500);
    }
};