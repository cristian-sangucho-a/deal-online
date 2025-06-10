import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/chatController.js';

const router = Router();

router.post('/chat', sendMessage);
router.get('/chat/:auction_id', getMessages);

export default router;