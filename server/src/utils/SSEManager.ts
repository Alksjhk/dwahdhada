import { Request, Response } from 'express';
import { Message, SSEEvent } from '../types';

// SSE连接管理器
export class SSEManager {
    private static instance: SSEManager;
    private connections: Map<number, Map<string, Response>> = new Map();
    // roomId -> Set of userIds
    private roomSubscribers: Map<number, Set<string>> = new Map();

    private constructor() {}

    static getInstance(): SSEManager {
        if (!SSEManager.instance) {
            SSEManager.instance = new SSEManager();
        }
        return SSEManager.instance;
    }

    // 添加SSE连接
    addConnection(roomId: number, userId: string, res: Response) {
        // 初始化房间连接映射
        if (!this.connections.has(roomId)) {
            this.connections.set(roomId, new Map());
        }
        
        // 初始化房间订阅者
        if (!this.roomSubscribers.has(roomId)) {
            this.roomSubscribers.set(roomId, new Set());
        }

        // 添加连接
        this.connections.get(roomId)!.set(userId, res);
        this.roomSubscribers.get(roomId)!.add(userId);

        console.log(`用户 ${userId} 订阅房间 ${roomId}，当前房间订阅者数: ${this.roomSubscribers.get(roomId)!.size}`);

        // 发送连接确认
        this.sendToClient(roomId, userId, {
            type: 'connected',
            data: {
                roomId,
                userId,
                timestamp: new Date().toISOString()
            }
        });

        // 设置连接关闭处理
        res.on('close', () => {
            this.removeConnection(roomId, userId);
        });
    }

    // 移除SSE连接
    removeConnection(roomId: number, userId: string) {
        const roomConnections = this.connections.get(roomId);
        const subscribers = this.roomSubscribers.get(roomId);

        if (roomConnections) {
            roomConnections.delete(userId);
            if (roomConnections.size === 0) {
                this.connections.delete(roomId);
            }
        }

        if (subscribers) {
            subscribers.delete(userId);
            if (subscribers.size === 0) {
                this.roomSubscribers.delete(roomId);
            }
        }

        console.log(`用户 ${userId} 取消订阅房间 ${roomId}，当前房间订阅者数: ${subscribers?.size || 0}`);
    }

    // 向特定用户发送消息
    private sendToClient(roomId: number, userId: string, event: any) {
        const roomConnections = this.connections.get(roomId);
        if (roomConnections && roomConnections.has(userId)) {
            const res = roomConnections.get(userId)!;
            try {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            } catch (error) {
                console.error(`发送消息给用户 ${userId} 失败:`, error);
                this.removeConnection(roomId, userId);
            }
        }
    }

    // 向房间所有订阅者广播消息
    broadcastToRoom(roomId: number, event: any) {
        const subscribers = this.roomSubscribers.get(roomId);
        if (!subscribers || subscribers.size === 0) {
            console.log(`房间 ${roomId} 没有订阅者`);
            return;
        }

        console.log(`向房间 ${roomId} 的 ${subscribers.size} 个订阅者广播消息`);

        subscribers.forEach(userId => {
            this.sendToClient(roomId, userId, event);
        });
    }

    // 广播新消息
    broadcastNewMessage(roomId: number, message: Message) {
        this.broadcastToRoom(roomId, {
            type: 'newMessage',
            data: message
        });
    }

    // 广播用户状态变化
    broadcastUserStatus(roomId: number, userId: string, status: 'online' | 'offline') {
        this.broadcastToRoom(roomId, {
            type: 'userStatus',
            data: {
                userId,
                status,
                timestamp: new Date().toISOString()
            }
        });
    }

    // 获取房间订阅者数量
    getRoomSubscriberCount(roomId: number): number {
        return this.roomSubscribers.get(roomId)?.size || 0;
    }

    // 获取所有房间订阅统计
    getStats() {
        const stats: { [key: number]: number } = {};
        this.roomSubscribers.forEach((subscribers, roomId) => {
            stats[roomId] = subscribers.size;
        });
        return stats;
    }
}