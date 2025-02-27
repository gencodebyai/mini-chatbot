import React, { useState } from 'react';
import MessageBubble from './MessageBubble';
import { serverURL } from '../Config';

const ChatArea = ({
  selectedModel,
  setSelectedModel,
  modelOptions,
  currentTurns,
  maxHistoryLength,
  darkMode,
  setDarkMode,
  handleExport,
  displayMessages,
  streaming,
  reasoningText,
  currentResponse,
  isReasoning,
  handleRetry,
  handleCopy,
  handleEdit,
  highlightedMessageId,
  chatContainerRef,
  handleScroll,
  loadingHistory,
  handleSubmit,
  input,
  setInput,
  handleStop
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (event) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    const files = event.target.files;
    const formData = new FormData();
    
    for (let file of files) {
      formData.append('documents', file);
    }
    
    try {
      console.log('开始上传文件:', files);
      const response = await fetch(`${serverURL}/upload`, {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log(`上传进度: ${progress}%`);
        }
      });
      
      const result = await response.json();
      console.log('上传结果:', result);
      
      if (response.ok) {
        setInput('文档已上传，您可以开始提问了');
        // 可以添加一个成功提示
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      setUploadError(error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = ''; // 清空文件选择
    }
  };

  return (
    <div style={{ 
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: darkMode ? '#1a1a1a' : '#fff'
    }}>
      {/* 头部区域 */}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* 左侧：模型选择 */}
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            fontSize: '14px',
            color: darkMode ? '#e0e0e0' : '#2c3e50',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {modelOptions.map(model => (
            <option 
              key={model} 
              value={model}
              style={{
                backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                color: darkMode ? '#e0e0e0' : '#2c3e50'
              }}
            >
              {model}
            </option>
          ))}
        </select>

        {/* 右侧：对话轮次和导出按钮 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div className="turns-counter" style={{ 
            color: currentTurns >= maxHistoryLength 
              ? '#ff4444' 
              : (darkMode ? '#e0e0e0' : '#666'),
            fontSize: '14px',
            padding: '6px 12px',
            backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
            borderRadius: '6px'
          }}>
            对话轮次: {currentTurns}/{maxHistoryLength}
          </div>
          
          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            style={{
              padding: '6px 12px',
              border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0'),
              borderRadius: '6px',
              background: darkMode ? '#2d2d2d' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: darkMode ? '#e0e0e0' : '#666',
              fontSize: '14px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            导出
          </button>
          
          {/* 深色模式切换按钮 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: '30px',
              height: '30px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: 'none',
              background: darkMode ? '#2d2d2d' : '#f5f5f5',
              cursor: 'pointer',
              color: darkMode ? '#e0e0e0' : '#666',
              fontSize: '16px'
            }}
            title={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* 文档上传按钮和状态显示 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="file"
              id="document-upload"
              multiple
              accept=".txt,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => document.getElementById('document-upload').click()}
              disabled={uploading}
              style={{
                padding: '8px 12px',
                backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
                borderRadius: '8px',
                color: darkMode ? '#e0e0e0' : '#333',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: uploading ? 0.7 : 1
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {uploading ? '上传中...' : '上传文档'}
            </button>

            {uploading && (
              <div style={{
                marginLeft: '8px',
                color: darkMode ? '#e0e0e0' : '#666'
              }}>
                {uploadProgress}%
              </div>
            )}

            {uploadError && (
              <div style={{
                marginLeft: '8px',
                color: '#ef5350'
              }}>
                上传失败: {uploadError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表区域 */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: darkMode ? '#1a1a1a' : '#fff'
        }}
      >
        {/* 显示历史消息 */}
        {displayMessages.map((msg, index) => (
          msg.role !== 'system' && (
            <MessageBubble 
              key={msg.id || index}
              content={msg.content}
              reasoningContent={msg.reasoning_content}
              isUser={msg.role === 'user'}
              onRetry={msg.role === 'assistant' ? () => handleRetry(msg) : null}
              onCopy={handleCopy}
              onEdit={msg.role === 'user' ? (newContent) => handleEdit(msg, newContent) : null}
              isStreaming={false}
              id={msg.id}
              highlightedMessageId={highlightedMessageId}
              darkMode={darkMode}
            />
          )
        ))}

        {/* 显示正在生成的消息 */}
        {streaming && (
          <>
            {/* 显示推理过程 */}
            {reasoningText && (
              <MessageBubble 
                content={null}
                reasoningContent={reasoningText}
                isUser={false}
                isStreaming={isReasoning}
                onCopy={handleCopy}
                darkMode={darkMode}
              />
            )}
            {/* 显示回复内容 */}
            {currentResponse && (
              <MessageBubble 
                content={currentResponse}
                reasoningContent={null}
                isUser={false}
                isStreaming={true}
                onCopy={handleCopy}
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-area" style={{ 
        borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
        padding: '10px 15px',
        backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa'
      }}>
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}
        >
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = '32px';
              const height = Math.min(e.target.scrollHeight, 32);
              e.target.style.height = height + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!streaming) {  // 只有在非流式输出时才允许发送
                  handleSubmit(e);
                  e.target.style.height = '32px';
                }
              }
            }}
            disabled={streaming}  // 在流式输出时禁用输入框
            style={{ 
              flex: 1, 
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s, height 0.2s',
              backgroundColor: darkMode 
                ? (streaming ? '#1a1a1a' : '#2d2d2d')
                : (streaming ? '#f5f5f5' : '#fff'),
              color: darkMode ? '#e0e0e0' : 'inherit',
              cursor: streaming ? 'not-allowed' : 'text',
              resize: 'none',
              height: '32px',
              maxHeight: '80px',
              overflowY: 'auto',
              lineHeight: '20px'
            }}
            placeholder={streaming ? '正在生成回复...' : '按 Enter 发送，Shift+Enter 换行'}
          />
          {streaming ? (
            <button 
              type="button" 
              onClick={handleStop}
              style={{ 
                padding: '12px 24px',
                backgroundColor: darkMode ? '#ef5350' : '#ef5350',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s'
              }}
            >
              停止
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={streaming}
              className="send-button"
              style={{ 
                padding: '12px 24px',
                backgroundColor: streaming 
                  ? (darkMode ? '#444' : '#e0e0e0')
                  : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: streaming ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s'
              }}
            >
              发送
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatArea; 