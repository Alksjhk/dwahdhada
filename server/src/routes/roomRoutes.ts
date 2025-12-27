import { Router } from 'express';
import { RoomController } from '../controllers/roomController';

const router = Router();
const controller = new RoomController();

// 获取公共大厅
router.get('/public', controller.getPublicRoom.bind(controller));

// 创建房间
router.post('/create', controller.createRoom.bind(controller));

// 加入房间
router.get('/join/:roomCode', controller.joinRoom.bind(controller));

export default router;