import React from 'react';
import { modelOptions, maxHistoryLength } from './Config';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { useChatLogic } from './ChatLogic';

function Chat() {
  const {
    displayMessages,
    input,
    setInput,
    selectedModel,
    setSelectedModel,
    streaming,
    currentResponse,
    reasoningText,
    isReasoning,
    darkMode,
    setDarkMode,
    conversations,
    isSidebarExpanded,
    chatContainerRef,
    handleSubmit,
    handleStop,
    handleNewChat,
    handleConversationClick,
    handleDeleteConversation,
    handleClearAll,
    handleExport,
    handleRetry,
    handleCopy,
    handleEdit,
    handleScroll,
    formatTime,
    currentTurns,
    highlightedMessageId,
    loadingHistory
  } = useChatLogic();

  return (
    <div className="main-container" style={{
      display: 'flex',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      <Sidebar 
        isSidebarExpanded={isSidebarExpanded}
        handleNewChat={handleNewChat}
        conversations={conversations}
        handleConversationClick={handleConversationClick}
        handleDeleteConversation={handleDeleteConversation}
        streaming={streaming}
        handleClearAll={handleClearAll}
        formatTime={formatTime}
        darkMode={darkMode}
      />

      <ChatArea 
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        modelOptions={modelOptions}
        currentTurns={currentTurns}
        maxHistoryLength={maxHistoryLength}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        handleExport={handleExport}
        displayMessages={displayMessages}
        streaming={streaming}
        reasoningText={reasoningText}
        currentResponse={currentResponse}
        isReasoning={isReasoning}
        handleRetry={handleRetry}
        handleCopy={handleCopy}
        handleEdit={handleEdit}
                      highlightedMessageId={highlightedMessageId}
        chatContainerRef={chatContainerRef}
        handleScroll={handleScroll}
        loadingHistory={loadingHistory}
        handleSubmit={handleSubmit}
        input={input}
        setInput={setInput}
        handleStop={handleStop}
      />

      {/* 深色模式样式表 */}
      <style>
        {`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .conversation-item:hover .delete-button {
    visibility: visible !important;
  }
  
          /* 深色模式样式... */
        `}
      </style>
    </div>
  );
}

export default Chat; 