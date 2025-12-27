import { Router } from 'express';
import { MessageController } from '../controllers/messageController';

const router = Router();
const controller = new MessageController();

// 发送消息
router.post('/send', controller.sendMessage.bind(controller));

// 获取消息（轮询接口）
router.get('/:roomId', controller.getMessages.bind(controller));

// 获取房间最新消息
router.get('/:roomId/latest', controller.getLatestMessages.bind(controller));

export default router;