import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, placeBid, closeAuction } from '../controllers/auction.Controller.js';
import verifyToken from '../middlewares/auth.middleware.js'; // Asegúrate de que la ruta sea correcta

const router = Router();

// Rutas que requieren autenticación
router.post('/products', verifyToken, createProduct);
router.put('/products/:id', verifyToken, updateProduct);
router.delete('/products/:id', verifyToken, deleteProduct);
router.post('/bids', verifyToken, placeBid);
router.post('/auctions/:auction_id/close', verifyToken, closeAuction);

// Rutas públicas
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

export default router;