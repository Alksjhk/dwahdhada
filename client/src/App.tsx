import React, { useEffect, useState } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import LoginForm from './components/LoginForm';
import NicknameForm from './components/NicknameForm';
import ChatContainer from './components/ChatContainer';
import ConnectionStatus from './components/ConnectionStatus';
import Aurora from './component/Aurora';
import './App.css';

const AppContent: React.FC = () => {
    const { state, setUser, setConnected } = useChat();
    const [showNicknameForm, setShowNicknameForm] = useState(false);

    useEffect(() => {
        const savedUserId = localStorage.getItem('chat_user_id');
        const savedNickname = localStorage.getItem('chat_nickname');
        
        if (savedUserId && savedNickname) {
            setUser(savedUserId);
            setConnected(true);
        } else if (savedUserId && !savedNickname) {
            // 有用户ID但没有昵称，显示昵称设置界面
            setShowNicknameForm(true);
        }
    }, [setUser, setConnected]);

    const handleLogin = (userId: string) => {
        setUser(userId);
        // 登录后检查是否有昵称
        const savedNickname = localStorage.getItem('chat_nickname');
        if (!savedNickname) {
            setShowNicknameForm(true);
        } else {
            setConnected(true);
        }
    };

    const handleNicknameSet = (nickname: string) => {
        localStorage.setItem('chat_nickname', nickname);
        setShowNicknameForm(false);
        setConnected(true);
    };

    // 显示昵称设置界面
    if (showNicknameForm) {
        return <NicknameForm onNicknameSet={handleNicknameSet} />;
    }

    // 显示登录界面
    if (!state.isConnected) {
        return <LoginForm onLogin={handleLogin} />;
    }

    // 显示聊天界面
    return <ChatContainer />;
};

const App: React.FC = () => {
    return (
        <ChatProvider>
            <div className="app">
                <Aurora
                    colorStops={["#10e8e8", "#15dc47", "#ece624"]}
                    blend={1.0}
                    amplitude={1.0}
                    speed={0.8}
                />
                <ConnectionStatus />
                <AppContent />
            </div>
        </ChatProvider>
    );
};

export default App;
