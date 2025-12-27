import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import styles from './MessageList.module.css';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    currentUser: string;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    currentUser
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 初次加载时立即滚动到底部
    useEffect(() => {
        if (messages.length > 0 && bottomRef.current) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 50);
        }
    }, [messages.length > 0]);

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>加载中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.messageList}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>💬</span>
                        <p>暂无消息</p>
                        <p className={styles.emptyHint}>发送第一条消息开始聊天吧</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={message.userId === currentUser}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default MessageList;
