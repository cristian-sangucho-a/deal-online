import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, placeBid, closeAuction } from '../controllers/auctionController.js';

const router = Router();

router.post('/products', createProduct);
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/bids', placeBid);
router.post('/auctions/:auction_id/close', closeAuction);

export default router;