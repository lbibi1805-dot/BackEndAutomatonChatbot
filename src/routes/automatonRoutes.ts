import { Router } from 'express';
import { AutomatonController } from '../controllers/automatonController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, AutomatonController.processInput);
router.get('/history', authMiddleware, AutomatonController.getConversationHistory);
router.put('/:conversationId/name', authMiddleware, AutomatonController.updateConversationName);
router.delete('/:conversationId', authMiddleware, AutomatonController.deleteConversation);

export default router;