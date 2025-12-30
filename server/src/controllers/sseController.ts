import { Request, Response } from 'express';
import { SSEManager } from '../utils/SSEManager';

const sseManager = SSEManager.getInstance();

export class SSEController {
    // 建立SSE连接
    async connect(req: Request, res: Response) {
        const roomId = parseInt(req.params.roomId);
        const userId = req.query.userId as string;

        if (!userId || isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: '用户ID和房间ID不能为空'
            });
        }

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // 发送初始连接事件
        res.write(`data: ${JSON.stringify({
            type: 'connected',
            data: {
                roomId,
                userId,
                timestamp: new Date().toISOString()
            }
        })}\n\n`);

        // 添加到SSE管理器
        sseManager.addConnection(roomId, userId, res);

        // 处理客户端断开连接
        req.on('close', () => {
            sseManager.removeConnection(roomId, userId);
        });

        req.on('aborted', () => {
            sseManager.removeConnection(roomId, userId);
        });
    }

    // 获取连接统计信息
    async getStats(req: Request, res: Response) {
        try {
            const stats = sseManager.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('获取SSE统计失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误'
            });
        }
    }
}