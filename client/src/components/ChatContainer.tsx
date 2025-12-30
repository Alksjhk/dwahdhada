import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { SSEManager } from '../utils/SSEManager';
import { messageAPI } from '../utils/api';
import ChatHeader from './ChatHeader';
import RoomSelector from './RoomSelector';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Room } from '../types';
import styles from './ChatContainer.module.css';

const ChatContainer: React.FC = () => {
    const { state, setRoom, setMessages, addMessages, setLoading } = useChat();
    const sseManagerRef = useRef<SSEManager | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>('未连接');

    useEffect(() => {
        if (state.currentUser && state.currentRoom) {
            startSSE(state.currentRoom);
        }

        return () => {
            sseManagerRef.current?.destroy();
        };
    }, [state.currentUser]);

    const startSSE = async (room: Room) => {
        // 清理旧的连接
        if (sseManagerRef.current) {
            sseManagerRef.current.destroy();
        }

        try {
            setLoading(true);
            
            // 先获取历史消息
            const data = await messageAPI.getLatestMessages(room.id, 50);
            if (data.success) {
                setMessages(data.messages);
            }

            // 创建SSE管理器
            sseManagerRef.current = new SSEManager(
                addMessages, // 新消息回调
                (connectedData) => {
                    console.log('SSE连接成功:', connectedData);
                    setConnectionStatus('已连接');
                },
                (error) => {
                    console.error('SSE连接错误:', error);
                    setConnectionStatus('连接错误');
                }
            );

            // 连接到SSE
            sseManagerRef.current.connect(room.id, state.currentUser);
            setConnectionStatus('连接中');

        } catch (error) {
            console.error('启动SSE失败:', error);
            setConnectionStatus('连接失败');
        } finally {
            setLoading(false);
        }
    };

    const handleRoomChange = async (room: Room) => {
        setRoom(room);
        await startSSE(room);
    };

    const handleSendMessage = async (content: string, messageType = 'text', fileData?: any) => {
        try {
            const requestData: any = {
                roomId: state.currentRoom.id,
                userId: state.currentUser,
                content,
                messageType
            };

            if (fileData) {
                requestData.fileName = fileData.fileName;
                requestData.fileSize = fileData.fileSize;
                requestData.fileUrl = fileData.fileUrl;
            }

            const data = await messageAPI.sendMessage(requestData);

            if (data.success) {
                // 消息会通过SSE自动推送，无需手动获取
                console.log('消息发送成功，等待SSE推送');
            } else {
                alert(data.message || '发送失败');
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            alert('网络错误，请重试');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('chat_user_id');
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <ChatHeader
                username={state.currentUser}
                onLogout={handleLogout}
                connectionStatus={connectionStatus}
            />
            
            <RoomSelector
                currentRoom={state.currentRoom}
                currentUser={state.currentUser}
                onRoomChange={handleRoomChange}
            />
            
            <div className={styles.main}>
                <MessageList
                    messages={state.messages}
                    isLoading={state.isLoading}
                    currentUser={state.currentUser}
                />
            </div>
            
            <MessageInput
                onSendMessage={handleSendMessage}
                disabled={state.isLoading}
            />
        </div>
    );
};

export default ChatContainer;
