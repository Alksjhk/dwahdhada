import React from 'react';
import { Button, Avatar } from './ui';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
    username: string;
    onLogout: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ username, onLogout }) => {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <div className={styles.logo}>💬</div>
                <h1 className={styles.title}>轻量级聊天</h1>
            </div>
            
            <div className={styles.right}>
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
