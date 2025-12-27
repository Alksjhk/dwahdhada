import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// 根据名字生成一致的颜色
const getColorFromName = (name: string): string => {
    const colors = [
        '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
        '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// 获取名字首字母
const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    
    // 中文名取第一个字
    if (/[\u4e00-\u9fa5]/.test(trimmed)) {
        return trimmed.charAt(0);
    }
    
    // 英文名取首字母
    return trimmed.charAt(0).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
    const bgColor = getColorFromName(name);
    const initials = getInitials(name);
    
    return (
        <div 
            className={`${styles.avatar} ${styles[size]} ${className}`}
            style={{ backgroundColor: bgColor }}
            title={name}
        >
            {initials}
        </div>
    );
};

export default Avatar;
