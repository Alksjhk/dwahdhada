import React from 'react';
import { Button, Avatar } from './ui';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
    username: string;
    onLogout: () => void;
    connectionStatus?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ username, onLogout, connectionStatus }) => {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div className={styles.logo}>💬</div>
                <h1 className={styles.title}>轻量级聊天</h1>
            </div>
            
            <div className={styles.right}>
                {connectionStatus && (
                    <div className={styles.connectionStatus}>
                        <span className={`${styles.statusDot} ${
                            connectionStatus === '已连接' ? styles.connected :
                            connectionStatus === '连接中' ? styles.connecting :
                            styles.disconnected
                        }`}></span>
                        <span className={styles.statusText}>{connectionStatus}</span>
                    </div>
                )}
                <div className={styles.userInfo}>
                    <Avatar name={username} size="sm" />
                    <span className={styles.username}>{username}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                    退出
                </Button>
            </div>
        </header>
    );
};

export default ChatHeader;
