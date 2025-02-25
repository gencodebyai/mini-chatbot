import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { baseURL, apiKey, modelOptions, maxHistoryLength, serverURL } from './Config'
import ReactMarkdown from 'react-markdown'

// 修改 MessageBubble 组件以同时显示两种内容
const MessageBubble = ({ 
  content, 
  reasoningContent, 
  isUser, 
  onRetry, 
  onCopy, 
  onEdit, 
  isStreaming,
  id,
  highlightedMessageId 
}) => {
  const [showButtons, setShowButtons] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
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
          <div 
            className="reasoning-bubble"
            onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
            style={{
              backgroundColor: '#f5f5f5',
              padding: '8px 12px',
              borderRadius: '15px',
              maxWidth: '85%',
              wordBreak: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: '1em',
              lineHeight: '1.4',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isReasoningExpanded ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  opacity: 0.7,
                  fontSize: '0.9em'
                }}>
                  {isStreaming ? (
                    <>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ animation: 'spin 2s linear infinite' }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      思考中...（点击收起）
                    </>
                  ) : (
                    <>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      思考完成（点击收起）
                    </>
                  )}
                </div>
                <ReactMarkdown
                  children={reasoningContent}
                  components={{
                    pre: ({node, ...props}) => (
                      <pre style={{
                        backgroundColor: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        margin: '8px 0'
                      }} {...props} />
                    ),
                    code: ({node, inline, ...props}) => (
                      inline ? 
                      <code style={{
                        backgroundColor: '#f8f9fa',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '0.9em'
                      }} {...props} /> :
                      <code {...props} />
                    )
                  }}
                />
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '6px' 
              }}>
                {isStreaming ? (
                  <>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    思考完成（点击展开）
                  </>
                ) : (
                  <>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    思考完成（点击展开）
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {content && (
        <div style={{ 
          margin: '10px', 
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          width: '100%',
          gap: '8px',
          transition: 'all 0.2s'
        }}>
          {/* 用户消息的操作按钮 */}
          {isUser && !isEditing && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignSelf: 'flex-end',
              paddingBottom: '4px'
            }}>
              <button
                onClick={() => {
                  if (onCopy) {
                    onCopy(content);
                  }
                }}
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
                  <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-2"/>
                </svg>
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
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                修改
              </button>
            </div>
          )}

          {/* 消息内容 - 添加编辑模式 */}
          {isEditing ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '85%',
              width: '500px',
              margin: '0 auto'  // 居中显示
            }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  minHeight: '100px',
                  width: '100%',
                  resize: 'vertical',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  outline: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.2s'
                }}
                autoFocus
              />
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(content);  // 重置为原始内容
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#666'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onEdit(editContent);
                    setIsEditing(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#1976d2',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  提交
                </button>
              </div>
            </div>
          ) : (
            <div 
              className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
              style={{
                backgroundColor: isUser && id === highlightedMessageId 
                  ? '#d4edda' // 高亮绿色
                  : (isUser ? '#e3f2fd' : '#f5f5f5'),
                padding: '8px 12px',
                borderRadius: '15px',
                maxWidth: '85%',
                wordBreak: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '1em',
                lineHeight: '1.4',
                transition: 'background-color 0.5s ease'
              }}
            >
              {isUser ? content : (
                <ReactMarkdown
                  children={content}
                  components={{
                    pre: ({node, ...props}) => (
                      <pre style={{
                        backgroundColor: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px',
                        overflowX: 'auto',
                        margin: '8px 0'
                      }} {...props} />
                    ),
                    code: ({node, inline, ...props}) => (
                      inline ? 
                      <code style={{
                        backgroundColor: '#f8f9fa',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '0.9em'
                      }} {...props} /> :
                      <code {...props} />
                    )
                  }}
                />
              )}
            </div>
          )}

          {/* AI 消息的操作按钮 */}
          {!isUser && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignSelf: 'flex-end',  // 确保按钮与消息底部对齐
              paddingBottom: '4px'  // 微调底部对齐位置
            }}>
              <button
                onClick={() => {
                  if (onCopy) {
                    onCopy(content);
                  }
                }}
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
                  <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-2"/>
                </svg>
                复制
              </button>
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
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-4.97 0-9-4.03-9-9m9 9a9 0 009-9"/>
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
  const [displayMessages, setDisplayMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      const activeConversation = parsed.find(conv => conv.active);
      return activeConversation?.messages || [{ role: "system", content: "You are a helpful assistant." }];
    }
    return [{ role: "system", content: "You are a helpful assistant." }];
  });

  const [requestMessages, setRequestMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      const activeConversation = parsed.find(conv => conv.active);
      return activeConversation?.messages || [{ role: "system", content: "You are a helpful assistant." }];
    }
    return [{ role: "system", content: "You are a helpful assistant." }];
  });

  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(modelOptions[0])
  const messagesEndRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [reasoningText, setReasoningText] = useState('')
  const [isReasoning, setIsReasoning] = useState(true)
  const [abortController, setAbortController] = useState(null);  // 添加用于停止请求的控制器
  const [userHasScrolled, setUserHasScrolled] = useState(false);  // 添加用户滚动标记
  const lastUserInteraction = useRef(Date.now());  // 记录最后用户交互时间
  const chatContainerRef = useRef(null);
  const isNearBottom = useRef(true);  // 添加这个来跟踪是否在底部
  const [autoScroll, setAutoScroll] = useState(true);  // 添加自动滚动控制
  const lastScrollPosition = useRef(0);  // 记录最后的滚动位置
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('chatHistory');  // 改回 chatHistory
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(chat => ({
        ...chat,
        title: chat.title || '新对话',
        lastMessage: chat.lastMessage || ''
      }));
    }
    return [{ 
      id: 'chat_' + Date.now(),  // 保持 chat_ 前缀
      title: '新对话',
      lastMessage: '',
      timestamp: Date.now(),
      active: true,
      messages: [{ role: "system", content: "You are a helpful assistant." }]
    }];
  });

  // 添加标题编辑状态
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // 添加标题编辑处理函数
  const handleTitleEdit = (conv) => {
    setEditingTitle(conv.id);
    setEditingTitleValue(conv.title);
  };

  // 添加标题保存函数
  const handleTitleSave = (convId) => {
    if (!editingTitleValue.trim()) return;
    
    const updatedConversations = conversations.map(conv => {
      if (conv.id === convId) {
        return {
          ...conv,
          title: editingTitleValue.trim()
        };
      }
      return conv;
    });
    
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
    setEditingTitle(null);
  };

  // 添加分页状态
  const [displayLimit, setDisplayLimit] = useState(20);  // 初始显示20条消息
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 添加消息发送状态标记
  const [sentMessageId, setSentMessageId] = useState(null);

  // 添加深色模式状态
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // 使用效果监听深色模式变化
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // 修改滚动到底部的函数
  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;

    const { scrollHeight, clientHeight } = chatContainerRef.current;
    const shouldScroll = force || 
      (!userHasScrolled && Date.now() - lastUserInteraction.current > 2000);

    if (shouldScroll) {
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  // 修改 updateState 函数，在每次更新时触发滚动
  const updateState = (newReasoningText, newResponseText, isReasoning) => {
    requestAnimationFrame(() => {
      if (isReasoning) {
        setReasoningText(newReasoningText);
      } else {
        setCurrentResponse(newResponseText);
      }
      // 每次更新内容后立即滚动
      scrollToBottom();
    });
  };

  // 修改滚动事件处理函数
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && !loadingHistory) {
      setLoadingHistory(true);
      setTimeout(() => {
        setDisplayLimit(prev => prev + 20);
        setLoadingHistory(false);
      }, 500);
    }
  };

  // 修改消息更新的处理
  useEffect(() => {
    if (streaming) {
      scrollToBottom();
    }
  }, [currentResponse, reasoningText, streaming]);

  // 新消息添加时的处理
  useEffect(() => {
    if (!streaming) {
      scrollToBottom(true);  // 新消息时强制滚动
      setUserHasScrolled(false);  // 重置用户滚动状态
    }
  }, [displayMessages.length]);

  // 修改输入框焦点处理
  const handleInputFocus = () => {
    setUserHasScrolled(false);
    scrollToBottom(true);
  };

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
    e.preventDefault();
    if (!input.trim()) return;

    const messageId = Date.now().toString();
    const newMessage = { 
      id: messageId,
      role: 'user', 
      content: input 
    }
    let updatedDisplayMessages = [...displayMessages, newMessage]
    let updatedRequestMessages = [...requestMessages, newMessage]
    
    // 设置发送状态以触发动画
    setSentMessageId(messageId);
    setTimeout(() => setSentMessageId(null), 1000); // 1秒后清除动画状态
    
    // 更新当前对话的历史记录、标题和最后一条消息
    const updatedConversations = conversations.map(conv => {
      if (conv.active) {
        const userMessages = conv.messages.filter(msg => msg.role === 'user');
        const isFirstUserMessage = userMessages.length === 0;
        
        return {
          ...conv,
          title: isFirstUserMessage 
            ? (input.length > 50 ? input.slice(0, 50) + '...' : input)
            : conv.title,
          lastMessage: input.length > 20 ? input.slice(0, 20) + '...' : input,  // 添加最后一条消息预览
          messages: updatedDisplayMessages,
          timestamp: Date.now()
        };
      }
      return conv;
    });

    // 更新状态和本地存储
    setDisplayMessages(updatedDisplayMessages);
    setRequestMessages(updatedRequestMessages);
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
      setInput('');
    // 重置输入框高度
    const textarea = e.target.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '32px';  // 重置为初始高度
    }

    // 开始流式响应
    setStreaming(true);
    setCurrentResponse('');
    setReasoningText('');
    setIsReasoning(true);

    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch(`${serverURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedRequestMessages,  // 使用更新后的消息
          model: selectedModel
        }),
        signal: controller.signal
      });

      await handleStreamResponse(response, updatedDisplayMessages);  // 传入更新后的消息列表

      // 发送成功后高亮消息
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 500);  // 500ms 后取消高亮

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

  // 修改 handleStreamResponse 函数
  const handleStreamResponse = async (response, currentMessages) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = '';
    let reasoningText = '';
    let currentIsReasoning = true;

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
            const newDisplayMessages = [...currentMessages, finalMessage];
            
            // 更新对话历史，保持当前对话的所有属性（包括标题）
            const updatedConversations = conversations.map(conv => {
              if (conv.active) {
                // 获取第一条用户消息作为标题（如果还没有标题）
                const firstUserMessage = conv.messages.find(msg => msg.role === 'user');
                const title = conv.title === '新对话' && firstUserMessage 
                  ? firstUserMessage.content.slice(0, 30) 
                  : conv.title;  // 保持现有标题
                
                return {
                  ...conv,
                  title,  // 保持或更新标题
                  messages: newDisplayMessages,
                  timestamp: Date.now()
                };
              }
              return conv;
            });

            // 更新状态和本地存储
            setDisplayMessages(newDisplayMessages);
            setRequestMessages([...requestMessages, {
              role: 'assistant',
              content: responseText
            }]);
            localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
            
            // 从本地存储重新加载对话列表
            const saved = localStorage.getItem('chatHistory');
            if (saved) {
              const parsed = JSON.parse(saved);
              setConversations(parsed);
            }
            
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
              // 如果是第一个内容标记，说明推理已完成
              if (currentIsReasoning) {
                currentIsReasoning = false;
                setIsReasoning(false);
              }
              responseText += content;
              // 传递 reasoningCompleted 给 MessageBubble
              updateState(reasoningText, responseText, false);
            }
          } catch (e) {
            console.error('解析响应出错:', e);
          }
        }
      }
    }
  };

  // 修改重试函数
  const handleRetry = async (message) => {
    // 找到当前消息的索引
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    // 获取到当前消息之前的所有消息
    const previousMessages = displayMessages.slice(0, messageIndex);
    // 过滤掉 reasoning_content 字段
    const requestMsgs = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 更新消息列表，移除当前的 AI 回答
    setDisplayMessages(previousMessages);
    setRequestMessages(requestMsgs);
    
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
          messages: requestMsgs,
          model: selectedModel
        })
      });

      // 传入当前消息列表
      await handleStreamResponse(response, previousMessages);
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
  };

  const currentTurns = getCurrentTurns(requestMessages)

  // 修改 handleCopy 函数
  const handleCopy = async (text) => {
    try {
      // 创建一个临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 将文本区域添加到文档中
      document.body.appendChild(textArea);
      
      // 选择文本
      textArea.select();
      
      try {
        // 尝试使用新 API
        await navigator.clipboard.writeText(text);
      } catch {
        // 如果新 API 失败，使用传统方法
        document.execCommand('copy');
      }
      
      // 移除临时文本区域
      document.body.removeChild(textArea);
      
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 修改编辑处理函数
  const handleEdit = async (message, newContent) => {
    // 找到要编辑的消息之前的所有消息
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    const previousMessages = displayMessages.slice(0, messageIndex);
    
    // 创建新的用户消息
    const editedMessage = { role: 'user', content: newContent };
    
    // 更新消息列表
    const updatedMessages = [...previousMessages, editedMessage];
    setDisplayMessages(updatedMessages);
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

      // 传入更新后的消息列表
      await handleStreamResponse(response, updatedMessages);
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

  // 修改点击历史对话的处理函数
  const handleConversationClick = (conv) => {
    const updatedConversations = conversations.map(c => ({
      ...c,
      active: c.id === conv.id
    }));
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
    
    // 重置当前状态
    setCurrentResponse('');
    setReasoningText('');
    setStreaming(false);
    
    // 设置消息
    const messages = conv.messages || [{ role: "system", content: "You are a helpful assistant." }];
    setDisplayMessages(messages);
    setRequestMessages(messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    // 直接设置滚动位置
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // 修改新对话按钮的处理
  const handleNewChat = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: '新对话',  // 初始标题
      active: true,
      messages: [{ role: "system", content: "You are a helpful assistant." }],
      timestamp: Date.now()
    };
    
    const updatedConversations = conversations.map(conv => ({
      ...conv,
      active: false
    }));
    
    const newConversations = [newConversation, ...updatedConversations];
    localStorage.setItem('chatHistory', JSON.stringify(newConversations));
    setConversations(newConversations);
    setDisplayMessages(newConversation.messages);
    setRequestMessages(newConversation.messages);
    setCurrentResponse('');
    setReasoningText('');
  };

  // 添加清除所有对话的处理函数
  const handleClearAll = () => {
    if (window.confirm('确定要清除所有对话吗？')) {
      const newConversation = {
        id: Date.now().toString(),
        title: '新对话',
        active: true,
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        timestamp: Date.now()
      };
      
      localStorage.setItem('chatHistory', JSON.stringify([newConversation]));
      setConversations([newConversation]);
      setDisplayMessages(newConversation.messages);
      setRequestMessages(newConversation.messages);
      setCurrentResponse('');
      setReasoningText('');
    }
  };

  // 添加格式化时间的辅助函数
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  // 添加导出聊天记录的函数
  const handleExport = () => {
    // 获取当前活跃对话
    const activeConversation = conversations.find(conv => conv.active);
    if (!activeConversation) return;

    // 格式化聊天记录
    const messages = activeConversation.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        const time = new Date().toLocaleString('zh-CN');
        const role = msg.role === 'user' ? '用户' : 'AI';
        return `${time} ${role}:\n${msg.content}\n`;
      })
      .join('\n');

    // 创建下载链接
    const blob = new Blob([messages], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `聊天记录_${activeConversation.title}_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 增强的响应式布局
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsSidebarExpanded(!isMobile);
      
      // 如果是移动设备，自动滚动到底部
      if (isMobile && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };
    
    handleResize(); // 初始化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 添加删除会话的处理函数
  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();  // 阻止触发会话选择
    
    const updatedConversations = conversations.filter(conv => conv.id !== convId);
    if (updatedConversations.length > 0) {
      // 如果删除的是当前会话，激活第一个会话
      if (conversations.find(conv => conv.id === convId)?.active) {
        updatedConversations[0].active = true;
        setDisplayMessages(updatedConversations[0].messages);
        setRequestMessages(updatedConversations[0].messages);
      }
    } else {
      // 如果删除了最后一个会话，创建新会话
      updatedConversations.push({
        id: 'chat_' + Date.now(),
        title: '新对话',
        active: true,
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        timestamp: Date.now()
      });
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  // 添加全局快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+N 或 Cmd+N: 新建对话
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!streaming) handleNewChat();
      }
      
      // Esc: 停止生成
      if (e.key === 'Escape' && streaming) {
        handleStop();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [streaming]);

  // 添加消息高亮状态
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  return (
    <div className="main-container" style={{
      display: 'flex',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* 左边栏 */}
      <div className="sidebar" style={{
        width: isSidebarExpanded ? '280px' : '60px',
        borderRight: '1px solid #e0e0e0',
        backgroundColor: '#fff',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* 标题区域 - 移除展开按钮 */}
        <div className="title-area" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px',
          borderBottom: '1px solid #e0e0e0',
          height: '64px',
          boxSizing: 'border-box'
        }}>
          {/* 使用图标+文字的组合，在折叠时只显示图标 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 聊天机器人图标 */}
            <div className="app-icon" style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#304254' : '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px'
            }}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <rect 
                  x="4" 
                  y="4" 
                  width="16" 
                  height="12" 
                  rx="2" 
                />
                <circle cx="9" cy="10" r="1" />
                <circle cx="12" cy="10" r="1" />
                <circle cx="15" cy="10" r="1" />
                <line x1="12" y1="16" x2="12" y2="20" />
              </svg>
            </div>
            
            {/* 只在展开状态显示文字 */}
            {isSidebarExpanded && (
              <h1 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 'bold',
                color: darkMode ? '#b0c4de' : '#2c3e50'
              }}>
                Mini Chatbot
              </h1>
            )}
          </div>
          
          {/* 侧边栏控制按钮 */}
                <button 
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: darkMode ? '#b0c4de' : '#666',
              opacity: 0.8,
              transition: 'opacity 0.2s',
              borderRadius: '4px'
            }}
            title={isSidebarExpanded ? "折叠边栏" : "展开边栏"}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              {isSidebarExpanded ? (
                // 左箭头
                <polyline points="16,4 8,12 16,20" />
              ) : (
                // 右箭头
                <polyline points="8,4 16,12 8,20" />
              )}
            </svg>
          </button>
        </div>

        {/* 新对话按钮 - 收缩时只显示图标 */}
        <button
          className="new-chat-button"
          onClick={handleNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            border: 'none',
            borderBottom: '1px solid #e0e0e0',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#333',
            transition: 'background-color 0.2s',
            marginTop: '0', // 确保没有上边距
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <line x1="12" y1="6" x2="12" y2="18" />
            <line x1="6" y1="12" x2="18" y2="12" />
          </svg>
          {isSidebarExpanded && "新建对话"}
        </button>

        {/* 对话历史列表 - 收缩时只显示图标 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 15px',
          marginTop: '10px'  // 添加顶部间距
        }}>
          {conversations.map((conv, index) => (
            <div
              key={conv.id}
              className="conversation-item"
              onClick={() => !streaming && handleConversationClick(conv)}
              style={{
                padding: isSidebarExpanded ? '12px' : '8px',  // 增加内边距
                marginBottom: '10px',  // 增加项目间距
                borderRadius: '8px',
                backgroundColor: conv.active ? '#f0f7ff' : 'transparent',
                cursor: streaming && !conv.active ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                gap: '12px',  // 增加图标和文字间距
                fontSize: '14px',
                opacity: streaming && !conv.active ? 0.5 : 1,
                position: 'relative',
                ':hover': {
                  backgroundColor: conv.active ? '#f0f7ff' : '#f5f5f5'
                }
              }}
            >
              {isSidebarExpanded ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',  // 标题和时间戳两端对齐
                      alignItems: 'center',
                      paddingRight: '24px'  // 为删除按钮留出空间
                    }}>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: conv.active ? '#1976d2' : (streaming ? '#999' : 'inherit')
                      }}>
                        {conv.title || '新对话'}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#999',
                        flexShrink: 0,  // 防止时间戳被压缩
                        marginLeft: '4px'  // 减小与标题的间距
                      }}>
                        {formatTime(conv.timestamp)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conv.lastMessage || ''}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: conv.active 
                    ? `hsl(${hashCode(conv.title || '新对话') % 360}, 80%, 65%)`  // 当前对话保持高亮
                    : (streaming ? '#ccc' : `hsl(${hashCode(conv.title || '新对话') % 360}, 70%, 80%)`),  // 其他变灰
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}>
                  {(conv.title || '新对话').charAt(0)}
                </div>
              )}
              {isSidebarExpanded && (
                <button
                  className="delete-button"
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  style={{
                    position: 'absolute',
                    right: '4px',  // 调整到更靠左的位置
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',  // 减小内边距
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    visibility: 'hidden',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          </div>
        
        {/* 清除所有对话按钮 */}
        <button
          onClick={handleClearAll}
          disabled={streaming}
          className="clear-button"
          style={{
            margin: '15px',
            padding: '0',
            border: 'none',
            background: 'transparent',
            color: '#ef5350',
            cursor: streaming ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            gap: '12px',
            transition: 'all 0.2s',
            opacity: streaming ? 0.5 : 1
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: streaming ? '#ccc' : '#ef5350',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
            </svg>
          </div>
          {isSidebarExpanded && '清除所有对话'}
        </button>
      </div>
      
      {/* 主聊天区域 */}
      <div style={{ 
        flex: 1,  // 占据剩余空间
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'  // 防止内容溢出
      }}>
        {/* 头部区域 */}
        <div className="header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          height: '64px', // 与边栏标题区域保持一致
          borderBottom: '1px solid #e0e0e0',
          boxSizing: 'border-box'
        }}>
          {/* 左侧：只保留模型选择 */}
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              fontSize: '14px',
              color: '#2c3e50',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {modelOptions.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          {/* 右侧：对话轮次和导出按钮 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div className="turns-counter" style={{ 
              color: currentTurns >= maxHistoryLength ? '#ff4444' : '#666',
              fontSize: '14px',
              padding: '6px 12px',
              backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
              borderRadius: '6px'
            }}>
              对话轮次: {currentTurns}/{maxHistoryLength}
      </div>
      
            {/* 添加导出按钮 */}
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
            
            {/* 添加深色模式切换按钮 */}
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
          </div>
        </div>

        {/* 聊天区域和输入框容器 */}
        <div className="chat-window" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          {/* 聊天区域 */}
          <div 
            ref={chatContainerRef}
            className="chat-container"
            onScroll={handleScroll}
            style={{ 
              flex: 1,
              minHeight: '400px',
              padding: '20px',
              overflow: 'auto',
              overscrollBehavior: 'contain'
            }} 
            id="chat-container"
          >
            {displayMessages.length === 1 ? (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                gap: '12px'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
                <span style={{ fontSize: '16px' }}>开始对话吧...</span>
              </div>
            ) : (
              <>
                {loadingHistory && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    padding: '10px'
                  }}>
                    正在加载历史消息...
                  </div>
                )}
                {displayMessages
                  .filter(msg => msg.role !== 'system')
                  .slice(-displayLimit)
                  .map((msg, index) => (
                    <MessageBubble 
                      key={index}
                      content={msg.content}
                      reasoningContent={msg.reasoning_content}
                      isUser={msg.role === 'user'}
                      onRetry={!msg.isUser ? () => handleRetry(msg) : null}
                      onCopy={handleCopy}
                      onEdit={msg.role === 'user' ? (newContent) => handleEdit(msg, newContent) : null}
                      isStreaming={streaming}
                      id={msg.id}
                      highlightedMessageId={highlightedMessageId}
                    />
                  ))}
                {streaming && (
                  <>
                    {reasoningText && (
                      <MessageBubble 
                        content={null}
                        reasoningContent={reasoningText}
                        isUser={false}
                        isStreaming={isReasoning}
                      />
                    )}
                    {currentResponse && !isReasoning && (
                      <MessageBubble 
                        content={currentResponse}
                        reasoningContent={null}
                        isUser={false}
                        isStreaming={false}
                      />
                    )}
                    <div ref={messagesEndRef} style={{ height: '1px', margin: '0' }} />
                  </>
                )}
              </>
            )}
          </div>
          
          {/* 输入区域 */}
          <div className="input-area" style={{ 
            borderTop: '1px solid #e0e0e0',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa'
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
            e.target.style.height = '32px';  // 设置初始高度
            const height = Math.min(e.target.scrollHeight, 80);  // 限制最大高度为80px
            e.target.style.height = height + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
              e.target.style.height = '32px';  // Enter 发送后也重置高度
            }
          }}
          onFocus={handleInputFocus}
          disabled={streaming}
          style={{ 
            flex: 1, 
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s, height 0.2s',
            backgroundColor: streaming ? '#f5f5f5' : '#fff',
            cursor: streaming ? 'not-allowed' : 'text',
            resize: 'none',
            height: '32px',  // 初始高度
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
                    backgroundColor: '#ef5350',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#d32f2f'
                    }
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
                    backgroundColor: streaming ? '#e0e0e0' : '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: streaming ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: streaming ? '#e0e0e0' : '#1565c0'
                    }
                  }}
                >
                  发送
        </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// 更新深色模式样式表，添加边栏顶部边框和缩进按钮的样式
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .conversation-item:hover .delete-button {
    visibility: visible !important;
  }
  
  /* 深色模式基础样式 */
  body.dark-mode {
    background-color: #1a1a1a;
    color: #e0e0e0;
  }
  
  /* 主容器深色样式 */
  body.dark-mode #root {
    background-color: #1a1a1a;
  }
  
  /* 整体界面深色样式 */
  body.dark-mode .main-container {
    background-color: #1a1a1a !important;
  }
  
  /* 聊天窗口深色样式 */
  body.dark-mode .chat-window {
    background-color: #232323 !important;
    border-color: #444 !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
  }
  
  /* 输入区域深色样式 */
  body.dark-mode .input-area {
    background-color: #1e1e1e !important;
    border-top: 1px solid #444 !important;
  }
  
  /* 边栏深色样式 - 修正边框 */
  body.dark-mode .sidebar {
    background-color: #232323 !important;
    border: none !important; /* 移除所有边框 */
    border-right: 1px solid #333 !important; /* 只保留右侧边框 */
  }
  
  /* 对话项深色样式 */
  body.dark-mode .conversation-item {
    background-color: transparent !important;
    color: #e0e0e0 !important;
  }
  
  body.dark-mode .conversation-item:hover {
    background-color: #2a2a2a !important;
  }
  
  body.dark-mode .conversation-item.active {
    background-color: #304254 !important;
    color: #ffffff !important;
  }
  
  /* 头像深色样式 */
  body.dark-mode .avatar-icon {
    background-color: #304254 !important;
    color: #ffffff !important;
  }
  
  /* 消息气泡深色样式 */
  body.dark-mode .message-bubble {
    background-color: #333333 !important;
    color: #e0e0e0 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
  }
  
  body.dark-mode .message-bubble.user {
    background-color: #1e3a5f !important;
  }
  
  body.dark-mode .reasoning-bubble {
    background-color: #2d2d2d !important;
    color: #aaaaaa !important;
  }
  
  /* 聊天容器深色样式 */
  body.dark-mode .chat-container {
    background-color: #1a1a1a !important;
  }
  
  /* 输入框深色样式 */
  body.dark-mode textarea,
  body.dark-mode select {
    background-color: #2d2d2d !important;
    color: #e0e0e0 !important;
    border-color: #444 !important;
  }
  
  /* 按钮深色样式 */
  body.dark-mode button {
    color: #e0e0e0 !important;
  }
  
  body.dark-mode .send-button {
    background-color: #1976d2 !important;
  }
  
  /* 头部区域深色样式 */
  body.dark-mode .header {
    background-color: #232323 !important;
    border-bottom: 1px solid #333 !important;
  }
  
  /* 对话轮次深色样式 */
  body.dark-mode .turns-counter {
    background-color: #2d2d2d !important;
    color: #e0e0e0 !important;
  }
  
  /* 代码块深色样式 */
  body.dark-mode pre {
    background-color: #2a2a2a !important;
    border: 1px solid #444 !important;
  }
  
  body.dark-mode code {
    background-color: #2a2a2a !important;
    color: #e0e0e0 !important;
  }
  
  /* 清除按钮深色样式 */
  body.dark-mode .clear-button {
    color: #ef5350 !important;
  }
  
  /* 新建聊天按钮深色样式 */
  body.dark-mode .new-chat-button {
    background-color: #2d2d2d !important;
    border-bottom: 1px solid #444 !important;
    color: #e0e0e0 !important;
    margin-top: 0 !important; /* 确保没有上边距 */
  }
  
  body.dark-mode .new-chat-button:hover {
    background-color: #3a3a3a !important;
  }
  
  /* 对话数字标签深色样式 */
  body.dark-mode .conversation-number {
    background-color: #3a3a3a !important;
    color: #aaa !important;
  }
  
  /* 激活状态的数字标签 */
  body.dark-mode .conversation-item.active .conversation-number {
    background-color: #304254 !important;
    color: #ccc !important;
  }
  
  /* 标题深色样式 */
  body.dark-mode .title-area {
    border-bottom-color: #333 !important;
  }
  
  body.dark-mode .title-area h1 {
    color: #b0c4de !important; /* 使用亮蓝灰色，在深色背景下更醒目 */
  }
  
  /* 确保两侧边框线颜色一致 */
  body.dark-mode .header {
    border-bottom-color: #333 !important;
  }
  
  /* 侧边栏切换按钮深色样式 */
  body.dark-mode .sidebar-toggle-btn {
    color: #b0c4de !important;
  }
  
  body.dark-mode .sidebar-toggle-btn:hover {
    background-color: #333 !important;
  }
  
  /* 应用图标深色模式样式 */
  body.dark-mode .app-icon {
    background-color: #304254 !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
  }
`;
document.head.appendChild(style);

// 添加辅助函数，用于生成稳定的哈希值
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export default Chat 