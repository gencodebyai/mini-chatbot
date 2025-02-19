import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { baseURL, apiKey, modelOptions, maxHistoryLength, serverURL } from './Config'

// 修改 MessageBubble 组件以同时显示两种内容
const MessageBubble = ({ content, reasoningContent, isUser, onRetry, onCopy, onEdit }) => {
  const [showButtons, setShowButtons] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleEditSubmit = () => {
    onEdit(editContent);
    setIsEditing(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {reasoningContent && (
        <div style={{ 
          margin: '10px', 
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '10px 15px',
            borderRadius: '15px',
            maxWidth: '85%',
            wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            fontSize: '1em',
            lineHeight: '1.4',
            color: '#666'
          }}>
            {reasoningContent}
          </div>
        </div>
      )}
      {content && (
        <div style={{ 
          margin: '10px', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          width: '100%'
        }}
        onMouseEnter={() => isUser && setShowButtons(true)}
        onMouseLeave={() => isUser && setShowButtons(false)}
        >
          {isEditing ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '85%',
              width: '500px',
              alignSelf: 'center'
            }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '15px',
                  border: '1px solid #ccc',
                  minHeight: '80px',
                  width: '100%',
                  resize: 'vertical',
                  fontSize: '1em',
                  lineHeight: '1.4',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  transition: 'border-color 0.2s',
                  ':focus': {
                    borderColor: '#1976d2'
                  }
                }}
                autoFocus
              />
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                justifyContent: 'flex-end',
                marginTop: '4px'
              }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    ':hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleEditSubmit}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#1976d2',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    ':hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  提交
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: isUser ? '#e3f2fd' : '#f5f5f5',
              padding: '10px 15px',
              borderRadius: '15px',
              maxWidth: '85%',
              wordBreak: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: '1em',
              lineHeight: '1.4',
              position: 'relative'
            }}>
              {content}
              {isUser && showButtons && (
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '0',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => onCopy?.(content)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      opacity: 0.7
                    }}
                  >
                    复制
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      opacity: 0.7
                    }}
                  >
                    修改
                  </button>
                </div>
              )}
            </div>
          )}
          {!isUser && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '4px',
              marginLeft: '15px'
            }}>
              <button
                onClick={() => onRetry?.(content)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#666',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = 1}
                onMouseLeave={e => e.target.style.opacity = 0.7}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-4.97 0-9-4.03-9-9m9 9a9 9 0 009-9"/>
                </svg>
                重试
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function Chat() {
  const [displayMessages, setDisplayMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ])
  const [requestMessages, setRequestMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(modelOptions[0])
  const messagesEndRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [reasoningText, setReasoningText] = useState('')
  const [isReasoning, setIsReasoning] = useState(true)
  const [abortController, setAbortController] = useState(null);  // 添加用于停止请求的控制器

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, currentResponse])

  // 计算当前对话轮次
  const getCurrentTurns = (msgs) => {
    return msgs.filter(msg => msg.role === 'user').length
  }

  // 修改停止函数
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setStreaming(false);
      setAbortController(null);
      
      // 如果有内容，将当前内容添加到消息列表
      if (currentResponse || reasoningText) {
        const finalMessage = {
          role: 'assistant',
          content: currentResponse,
          reasoning_content: reasoningText
        };
        setDisplayMessages(prev => [...prev, finalMessage]);
        setRequestMessages(prev => [...prev, {
          role: 'assistant',
          content: currentResponse
        }]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = { role: 'user', content: input }
    let updatedDisplayMessages = [...displayMessages, newMessage]
    let updatedRequestMessages = [...requestMessages, newMessage]
    
    // 保持系统消息，并限制历史消息数量
    const currentTurns = getCurrentTurns(updatedRequestMessages)
    
    if (currentTurns > maxHistoryLength) {
      const systemMessage = updatedRequestMessages[0]
      const recentMessages = []
      let turns = 0
      
      for (let i = updatedRequestMessages.length - 1; i > 0; i--) {
        recentMessages.unshift(updatedRequestMessages[i])
        if (updatedRequestMessages[i].role === 'user') {
          turns++
          if (turns === maxHistoryLength) break
        }
      }
      
      updatedRequestMessages = [systemMessage, ...recentMessages]
      // 显示消息保持完整历史
      updatedDisplayMessages = [...displayMessages, newMessage]
    }
    
    setDisplayMessages(updatedDisplayMessages)
    setRequestMessages(updatedRequestMessages)
    setInput('')
    setStreaming(true)
    setCurrentResponse('')
    setReasoningText('')
    setIsReasoning(true)

    try {
      const controller = new AbortController();  // 创建新的 AbortController
      setAbortController(controller);

      const response = await fetch(`${serverURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedRequestMessages,
          model: selectedModel
        }),
        signal: controller.signal  // 添加 signal
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let responseText = ''
      let reasoningText = ''
      let currentIsReasoning = true

      // 使用 requestAnimationFrame 来优化更新
      const updateState = (newReasoningText, newResponseText, isReasoning) => {
        requestAnimationFrame(() => {
          if (isReasoning) {
            setReasoningText(newReasoningText)
          } else {
            setCurrentResponse(newResponseText)
          }
        })
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') {
              const finalMessage = {
                role: 'assistant',
                content: responseText,
                reasoning_content: reasoningText
              }
              setDisplayMessages(prev => [...prev, finalMessage])
              setRequestMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText
              }])
              setStreaming(false)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              const reasoningContent = parsed.choices[0]?.delta?.reasoning_content

              if (reasoningContent) {
                reasoningText += reasoningContent
                updateState(reasoningText, '', true)
              } else if (content) {
                if (currentIsReasoning) {
                  currentIsReasoning = false
                  setIsReasoning(false)
                }
                responseText += content
                updateState('', responseText, false)
              }
            } catch (e) {
              console.error('解析响应出错:', e)
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求被中止');
        return;
      }
      console.error('请求失败:', error)
      setStreaming(false)
      const errorMessage = {
        role: 'assistant',
        content: '发生错误：' + error.message
      }
      setDisplayMessages(prev => [...prev, errorMessage])
      setRequestMessages(prev => [...prev, errorMessage])
    } finally {
      setAbortController(null);
    }
  }

  // 添加重试函数
  const handleRetry = async (message) => {
    // 找到当前消息的索引
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    // 获取到当前消息之前的所有消息（包括当前消息的上一条用户消息）
    const userMessageIndex = messageIndex - 1;
    // 过滤掉 reasoning_content 字段
    const previousMessages = displayMessages.slice(0, messageIndex).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 更新消息列表，移除当前的 AI 回答
    setDisplayMessages(displayMessages.slice(0, messageIndex));
    setRequestMessages(previousMessages);
    
    // 重新发送请求
    setStreaming(true);
    setCurrentResponse('');
    setReasoningText('');
    setIsReasoning(true);

    try {
      const response = await fetch(`${serverURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: previousMessages,  // 已经过滤掉 reasoning_content 字段
          model: selectedModel
        })
      });

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let responseText = ''
      let reasoningText = ''
      let currentIsReasoning = true

      // 使用 requestAnimationFrame 来优化更新
      const updateState = (newReasoningText, newResponseText, isReasoning) => {
        requestAnimationFrame(() => {
          if (isReasoning) {
            setReasoningText(newReasoningText)
          } else {
            setCurrentResponse(newResponseText)
          }
        })
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') {
              const finalMessage = {
                role: 'assistant',
                content: responseText,
                reasoning_content: reasoningText
              }
              setDisplayMessages(prev => [...prev, finalMessage])
              setRequestMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText
              }])
              setStreaming(false)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              const reasoningContent = parsed.choices[0]?.delta?.reasoning_content

              if (reasoningContent) {
                reasoningText += reasoningContent
                updateState(reasoningText, '', true)
              } else if (content) {
                if (currentIsReasoning) {
                  currentIsReasoning = false
                  setIsReasoning(false)
                }
                responseText += content
                updateState('', responseText, false)
              }
            } catch (e) {
              console.error('解析响应出错:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('重试失败:', error)
      setStreaming(false)
      const errorMessage = {
        role: 'assistant',
        content: '重试失败：' + error.message
      }
      setDisplayMessages(prev => [...prev, errorMessage])
      setRequestMessages(prev => [...prev, errorMessage])
    }
  }

  const currentTurns = getCurrentTurns(requestMessages)

  // 添加复制函数
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 添加编辑处理函数
  const handleEdit = async (message, newContent) => {
    // 找到要编辑的消息之前的所有消息
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    const previousMessages = displayMessages.slice(0, messageIndex);
    
    // 创建新的用户消息
    const editedMessage = { role: 'user', content: newContent };
    
    // 更新消息列表
    setDisplayMessages([...previousMessages, editedMessage]);
    setRequestMessages([...previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })), editedMessage]);
    
    // 重新发送请求
    setStreaming(true);
    setCurrentResponse('');
    setReasoningText('');
    setIsReasoning(true);

    try {
      const response = await fetch(`${serverURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })), editedMessage],
          model: selectedModel
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';
      let reasoningText = '';
      let currentIsReasoning = true;

      // 使用 requestAnimationFrame 来优化更新
      const updateState = (newReasoningText, newResponseText, isReasoning) => {
        requestAnimationFrame(() => {
          if (isReasoning) {
            setReasoningText(newReasoningText);
          } else {
            setCurrentResponse(newResponseText);
          }
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              const finalMessage = {
                role: 'assistant',
                content: responseText,
                reasoning_content: reasoningText
              };
              setDisplayMessages(prev => [...prev, finalMessage]);
              setRequestMessages(prev => [...prev, {
                role: 'assistant',
                content: responseText
              }]);
              setStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              const reasoningContent = parsed.choices[0]?.delta?.reasoning_content;

              if (reasoningContent) {
                reasoningText += reasoningContent;
                updateState(reasoningText, '', true);
              } else if (content) {
                if (currentIsReasoning) {
                  currentIsReasoning = false;
                  setIsReasoning(false);
                }
                responseText += content;
                updateState('', responseText, false);
              }
            } catch (e) {
              console.error('解析响应出错:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('编辑请求失败:', error);
      setStreaming(false);
      const errorMessage = {
        role: 'assistant',
        content: '编辑请求失败：' + error.message
      };
      setDisplayMessages(prev => [...prev, errorMessage]);
      setRequestMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Mini Chatbot</h1>
      <div style={{ 
        marginBottom: '10px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          {modelOptions.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <div style={{ 
          color: currentTurns >= maxHistoryLength ? '#ff4444' : '#666'
        }}>
          对话轮次: {currentTurns}/{maxHistoryLength}
        </div>
      </div>
      <div style={{ 
        marginBottom: '20px', 
        height: '500px',
        border: '1px solid #ccc', 
        borderRadius: '5px',
        overflow: 'auto',
        padding: '10px',
        scrollBehavior: 'smooth'
      }} id="chat-container">
        {displayMessages.length === 1 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '220px' }}>
            开始对话吧...
          </div>
        ) : (
          <>
            {displayMessages.filter(msg => msg.role !== 'system').map((msg, index) => (
              <MessageBubble 
                key={index}
                content={msg.content}
                reasoningContent={msg.reasoning_content}
                isUser={msg.role === 'user'}
                onRetry={!msg.isUser ? () => handleRetry(msg) : null}
                onCopy={msg.role === 'user' ? () => handleCopy(msg.content) : null}
                onEdit={msg.role === 'user' ? (newContent) => handleEdit(msg, newContent) : null}
              />
            ))}
            {streaming && (
              <>
                {reasoningText && (
                  <MessageBubble 
                    content={null}
                    reasoningContent={reasoningText}
                    isUser={false}
                  />
                )}
                {currentResponse && !isReasoning && (
                  <MessageBubble 
                    content={currentResponse}
                    reasoningContent={null}
                    isUser={false}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
          placeholder="输入消息..."
        />
        {streaming ? (
          <button 
            type="button" 
            onClick={handleStop}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            停止
          </button>
        ) : (
          <button 
            type="submit" 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            发送
          </button>
        )}
      </form>
    </div>
  )
}

export default Chat 