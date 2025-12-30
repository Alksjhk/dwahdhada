import { Router } from 'express';
import { SSEController } from '../controllers/sseController';

const router = Router();
const controller = new SSEController();

// 获取连接统计信息
router.get('/stats', controller.getStats.bind(controller));

// 建立SSE连接
router.get('/:roomId', controller.connect.bind(controller));

export default router;