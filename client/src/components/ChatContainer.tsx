import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { MessagePoller } from '../utils/MessagePoller';
import { messageAPI } from '../utils/api';
import ChatHeader from './ChatHeader';
import RoomSelector from './RoomSelector';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Room } from '../types';
import styles from './ChatContainer.module.css';

const ChatContainer: React.FC = () => {
    const { state, setRoom, setMessages, addMessages, setLoading } = useChat();
    const pollerRef = useRef<MessagePoller | null>(null);

    useEffect(() => {
        if (state.currentUser && state.currentRoom) {
            startPolling(state.currentRoom);
        }

        return () => {
            pollerRef.current?.stop();
        };
    }, [state.currentUser]);

    const startPolling = async (room: Room) => {
        pollerRef.current?.stop();

        try {
            setLoading(true);
            const data = await messageAPI.getLatestMessages(room.id, 50);
            
            if (data.success) {
                setMessages(data.messages);
                
                const lastMessageId = data.messages.length > 0 
                    ? data.messages[data.messages.length - 1].id 
                    : 0;

                pollerRef.current = new MessagePoller(room.id, addMessages);
                pollerRef.current.setLastMessageId(lastMessageId);
                pollerRef.current.start();
            }
        } catch (error) {
            console.error('加载消息失败:', error);
            pollerRef.current = new MessagePoller(room.id, addMessages);
            pollerRef.current.start();
        } finally {
            setLoading(false);
        }
    };

    const handleRoomChange = async (room: Room) => {
        setRoom(room);
        await startPolling(room);
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
                // 立即触发轮询获取最新消息
                setTimeout(() => {
                    pollerRef.current?.fetchMessages();
                }, 100);
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
