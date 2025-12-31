import React, { useState, useRef } from 'react';
import { Button } from './ui';
import { API_CONFIG } from '../config/api';
import styles from './MessageInput.module.css';

interface MessageInputProps {
    onSendMessage: (content: string, messageType?: string, fileData?: any) => void;
    disabled?: boolean;
}

const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'application/zip', 'application/x-rar-compressed'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    disabled = false
}) => {
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        const trimmedContent = content.trim();
        if (!trimmedContent || sending || disabled || uploading) return;

        setSending(true);
        try {
            onSendMessage(trimmedContent);
            setContent('');
            // 重置 textarea 高度
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // 自动调整高度
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 重置 input
        e.target.value = '';

        // 验证文件大小
        if (file.size > MAX_FILE_SIZE) {
            alert('文件大小不能超过10MB');
            return;
        }

        // 验证文件类型
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            alert('不支持的文件类型');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadURL = API_CONFIG.baseURL ? `${API_CONFIG.baseURL}/api/files/upload` : '/api/files/upload';
            const response = await fetch(uploadURL, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                onSendMessage(
                    content.trim() || file.name,
                    result.data.messageType,
                    result.data
                );
                setContent('');
            } else {
                alert(result.message || '文件上传失败');
            }
        } catch {
            alert('文件上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const isDisabled = disabled || sending || uploading;
    const canSend = content.trim().length > 0 && !isDisabled;

    return (
        <div className={styles.container}>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                disabled={isDisabled}
            />

            <form onSubmit={handleSubmit} className={styles.form}>
                <button
                    type="button"
                    onClick={handleFileClick}
                    disabled={isDisabled}
                    className={styles.attachBtn}
                    title="上传文件"
                >
                    {uploading ? '⏳' : '📎'}
                </button>

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    disabled={isDisabled}
                    className={styles.textarea}
                    rows={1}
                />

                <Button
                    type="submit"
                    size="sm"
                    disabled={!canSend}
                    loading={sending}
                >
                    发送
                </Button>
            </form>

            {content.length > 0 && (
                <div className={styles.counter}>
                    <span className={content.length > 500 ? styles.warning : ''}>
                        {content.length}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MessageInput;
