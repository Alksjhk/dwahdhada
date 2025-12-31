import React, { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import LoginForm from './components/LoginForm';
import ChatContainer from './components/ChatContainer';
import ConnectionStatus from './components/ConnectionStatus';
import Aurora from './component/Aurora';
import './App.css';

const AppContent: React.FC = () => {
    const { state, dispatch } = useChat();

    useEffect(() => {
        const savedUserId = localStorage.getItem('chat_user_id');

        if (savedUserId) {
            dispatch({ type: 'SET_USER', payload: savedUserId });
            dispatch({ type: 'SET_CONNECTED', payload: true });
        }
    }, []); // 移除依赖项，只在组件挂载时执行一次

    const handleLogin = (userId: string) => {
        dispatch({ type: 'SET_USER', payload: userId });
        dispatch({ type: 'SET_CONNECTED', payload: true });
    };

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
