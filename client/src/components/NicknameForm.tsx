import React, { useState } from 'react';
import { Button, Input } from './ui';
import styles from './NicknameForm.module.css';

interface NicknameFormProps {
  onNicknameSet: (nickname: string) => void;
}

const NicknameForm: React.FC<NicknameFormProps> = ({ onNicknameSet }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('default');

  const validateNickname = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return '请输入昵称';
    if (trimmed.length < 2) return '昵称至少需要2个字符';
    if (trimmed.length > 20) return '昵称不能超过20个字符';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    
    // 模拟短暂延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const finalNickname = nickname.trim();
    // 保存头像选择
    localStorage.setItem('chat_avatar', selectedAvatar);
    onNicknameSet(finalNickname);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const avatarOptions = [
    { id: 'default', emoji: '👤', title: '默认头像' },
    { id: 'colorful', emoji: '🎨', title: '彩色头像' },
    { id: 'animal', emoji: '🐱', title: '动物头像' },
    { id: 'nature', emoji: '🌟', title: '自然头像' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>👤</div>
          <h1 className={styles.title}>设置昵称</h1>
          <p className={styles.subtitle}>为你的聊天设置一个个性化昵称</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入你的昵称"
            maxLength={20}
            autoFocus
            fullWidth
            error={error}
          />

          <div className={styles.avatarSection}>
            <div className={styles.sectionDivider}>
              <div className={styles.line} />
              <span className={styles.sectionTitle}>选择头像风格</span>
              <div className={styles.line} />
            </div>
            
            <div className={styles.avatarOptions}>
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`${styles.avatarOption} ${
                    selectedAvatar === avatar.id ? styles.active : ''
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  title={avatar.title}
                >
                  <div className={styles.avatarPreview}>
                    {avatar.emoji}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!nickname.trim()}
          >
            确认设置
          </Button>
        </form>

        <div className={styles.tips}>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>✓</span>
            <span>昵称长度为2-20个字符</span>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>✓</span>
            <span>昵称将作为你在聊天中的显示名称</span>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>✓</span>
            <span>可以随时在设置中修改</span>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            个性化你的聊天体验 ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default NicknameForm;