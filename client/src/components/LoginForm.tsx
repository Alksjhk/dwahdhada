import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import styles from './LoginForm.module.css';

interface LoginFormProps {
    onLogin: (userId: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedUserId = localStorage.getItem('chat_user_id');
        if (savedUserId) {
            setUserId(savedUserId);
        }
    }, []);

    const validateUserId = (id: string): string | null => {
        const trimmed = id.trim();
        if (!trimmed) return '请输入用户ID';
        if (trimmed.length < 2) return '用户ID至少需要2个字符';
        if (trimmed.length > 20) return '用户ID不能超过20个字符';
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(trimmed)) {
            return '用户ID只能包含字母、数字、中文、下划线和横线';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validateUserId(userId);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        
        // 模拟短暂延迟以显示加载状态
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const finalUserId = userId.trim();
        localStorage.setItem('chat_user_id', finalUserId);
        onLogin(finalUserId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>💬</div>
                    <h1 className={styles.title}>轻量级聊天</h1>
                    <p className={styles.subtitle}>输入用户ID开始聊天</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="请输入用户ID"
                        maxLength={20}
                        autoFocus
                        fullWidth
                        error={error}
                    />

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isLoading}
                        disabled={!userId.trim()}
                    >
                        进入聊天
                    </Button>
                </form>

                <div className={styles.tips}>
                    <div className={styles.tipItem}>
                        <span className={styles.tipIcon}>✓</span>
                        <span>无需注册，输入ID即可开始</span>
                    </div>
                    <div className={styles.tipItem}>
                        <span className={styles.tipIcon}>✓</span>
                        <span>默认进入公共大厅</span>
                    </div>
                    <div className={styles.tipItem}>
                        <span className={styles.tipIcon}>✓</span>
                        <span>支持创建私密房间</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
