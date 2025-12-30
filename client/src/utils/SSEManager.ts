import { Message } from '../types';

export interface SSEEvent {
    type: 'connected' | 'newMessage' | 'userStatus' | 'error';
    data: any;
}

export class SSEManager {
    private eventSource: EventSource | null = null;
    private roomId: number | null = null;
    private userId: string | null = null;
    private onNewMessages: ((messages: Message[]) => void) | null = null;
    private onConnected: ((data: any) => void) | null = null;
    private onError: ((error: Event) => void) | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // 1秒
    private isConnecting = false;

    constructor(
        onNewMessages?: (messages: Message[]) => void,
        onConnected?: (data: any) => void,
        onError?: (error: Event) => void
    ) {
        this.onNewMessages = onNewMessages || null;
        this.onConnected = onConnected || null;
        this.onError = onError || null;
    }

    // 连接到SSE
    connect(roomId: number, userId: string) {
        if (this.isConnecting) {
            console.log('正在连接中，跳过重复连接');
            return;
        }

        // 如果已经连接到相同房间，先断开
        if (this.eventSource && this.roomId === roomId) {
            console.log('已连接到相同房间，跳过重复连接');
            return;
        }

        this.disconnect();
        this.roomId = roomId;
        this.userId = userId;
        this.isConnecting = true;

        const url = `/api/sse/${roomId}?userId=${encodeURIComponent(userId)}`;
        console.log(`连接SSE: ${url}`);

        try {
            this.eventSource = new EventSource(url);

            this.eventSource.onopen = (event) => {
                console.log('SSE连接已建立', event);
                this.isConnecting = false;
                this.reconnectAttempts = 0;
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const sseEvent: SSEEvent = JSON.parse(event.data);
                    this.handleEvent(sseEvent);
                } catch (error) {
                    console.error('解析SSE消息失败:', error, event.data);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE连接错误:', error);
                this.isConnecting = false;
                
                if (this.onError) {
                    this.onError(error);
                }

                // 自动重连
                this.handleReconnect();
            };

        } catch (error) {
            console.error('创建SSE连接失败:', error);
            this.isConnecting = false;
            this.handleReconnect();
        }
    }

    // 处理SSE事件
    private handleEvent(event: SSEEvent) {
        switch (event.type) {
            case 'connected':
                console.log('SSE连接确认:', event.data);
                if (this.onConnected) {
                    this.onConnected(event.data);
                }
                break;

            case 'newMessage':
                console.log('收到新消息:', event.data);
                if (this.onNewMessages) {
                    this.onNewMessages([event.data]);
                }
                break;

            case 'userStatus':
                console.log('用户状态变化:', event.data);
                // 可以在这里处理用户上线/下线状态
                break;

            case 'error':
                console.error('服务器错误:', event.data);
                break;

            default:
                console.log('未知事件类型:', event);
        }
    }

    // 处理重连
    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('达到最大重连次数，停止重连');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

        console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`);

        setTimeout(() => {
            if (this.roomId && this.userId) {
                this.connect(this.roomId, this.userId);
            }
        }, delay);
    }

    // 断开连接
    disconnect() {
        if (this.eventSource) {
            console.log('断开SSE连接');
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

    // 更新房间ID
    updateRoomId(newRoomId: number) {
        if (this.userId) {
            this.connect(newRoomId, this.userId);
        }
    }

    // 检查连接状态
    isConnected(): boolean {
        return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
    }

    // 获取连接状态描述
    getConnectionState(): string {
        if (!this.eventSource) return '未连接';
        switch (this.eventSource.readyState) {
            case EventSource.CONNECTING: return '连接中';
            case EventSource.OPEN: return '已连接';
            case EventSource.CLOSED: return '已断开';
            default: return '未知状态';
        }
    }

    // 销毁管理器
    destroy() {
        this.disconnect();
        this.onNewMessages = null;
        this.onConnected = null;
        this.onError = null;
        console.log('SSE管理器已销毁');
    }
}