import { useState, useRef, useEffect } from 'react';
import { modelOptions, maxHistoryLength, serverURL } from './Config';

// 辅助函数
export const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const getCurrentTurns = (msgs) => {
  return msgs.filter(msg => msg.role === 'user').length;
};

export const formatTime = (timestamp) => {
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

// 在文件顶部添加 updateState 函数的定义
const updateState = (setReasoningText, setCurrentResponse, scrollToBottom) => 
  (newReasoningText, newResponseText, isReasoning) => {
    requestAnimationFrame(() => {
      if (isReasoning) {
        setReasoningText(newReasoningText);
      } else {
        setCurrentResponse(newResponseText);
      }
      scrollToBottom();
    });
  };

export const useChatLogic = () => {
  // 所有状态定义
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

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [streaming, setStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoning, setIsReasoning] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(chat => ({
        ...chat,
        title: chat.title || '新对话',
        lastMessage: chat.lastMessage || ''
      }));
    }
    return [{ 
      id: Date.now().toString(),
      title: '新对话',
      lastMessage: '',
      timestamp: Date.now(),
      active: true,
      messages: [{ role: "system", content: "You are a helpful assistant." }]
    }];
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sentMessageId, setSentMessageId] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);
  const lastUserInteraction = useRef(Date.now());
  const isNearBottom = useRef(true);
  const lastScrollPosition = useRef(0);

  // 滚动相关函数
  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    const { scrollHeight, clientHeight } = chatContainerRef.current;
    const shouldScroll = force || 
      (!userHasScrolled && Date.now() - lastUserInteraction.current > 2000);
    if (shouldScroll) {
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

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

  // 创建 updateState 实例
  const updateStateInstance = updateState(setReasoningText, setCurrentResponse, scrollToBottom);

  // 消息处理函数
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageId = Date.now().toString();
    const newMessage = { 
      id: messageId,
      role: 'user', 
      content: input 
    };
    
    let updatedDisplayMessages = [...displayMessages, newMessage];
    let updatedRequestMessages = [...requestMessages, newMessage];
    
    setSentMessageId(messageId);
    setTimeout(() => setSentMessageId(null), 1000);
    
    const updatedConversations = conversations.map(conv => {
      if (conv.active) {
        const userMessages = conv.messages.filter(msg => msg.role === 'user');
        const isFirstUserMessage = userMessages.length === 0;
        
        return {
          ...conv,
          title: isFirstUserMessage 
            ? (input.length > 50 ? input.slice(0, 50) + '...' : input)
            : conv.title,
          lastMessage: input.length > 20 ? input.slice(0, 20) + '...' : input,
          messages: updatedDisplayMessages,
          timestamp: Date.now()
        };
      }
      return conv;
    });

    setDisplayMessages(updatedDisplayMessages);
    setRequestMessages(updatedRequestMessages);
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
    setInput('');

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
          messages: updatedRequestMessages,
          model: selectedModel,
          stream: true
        }),
        signal: controller.signal
      });

      await handleStreamResponse(response, updatedDisplayMessages);
      
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 500);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求被中止');
        return;
      }
      console.error('请求失败:', error);
      setStreaming(false);
      const errorMessage = {
        role: 'assistant',
        content: '发生错误：' + error.message
      };
      setDisplayMessages(prev => [...prev, errorMessage]);
      setRequestMessages(prev => [...prev, errorMessage]);
    } finally {
      setAbortController(null);
    }
  };

  // 处理停止生成
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setStreaming(false);
      setAbortController(null);
      
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

  // 处理流式响应
  const handleStreamResponse = async (response, currentMessages) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = '';
    let reasoningText = '';
    let currentIsReasoning = true;

    try {
      // 开始流式响应前清空当前响应
      setCurrentResponse('');
      setReasoningText('');
      setIsReasoning(true);
      
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
              
              // 更新对话历史，保持当前对话的所有属性
              const updatedConversations = conversations.map(conv => {
                if (conv.active) {
                  // 获取第一条用户消息作为标题（如果还没有标题）
                  const firstUserMessage = conv.messages.find(msg => msg.role === 'user');
                  const title = conv.title === '新对话' && firstUserMessage 
                    ? firstUserMessage.content.slice(0, 30) 
                    : conv.title;
                  
                  return {
                    ...conv,
                    title,
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
              setConversations(updatedConversations);
              setStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              const reasoningContent = parsed.choices[0]?.delta?.reasoning_content;

              if (reasoningContent) {
                reasoningText += reasoningContent;
                setReasoningText(reasoningText);
                setIsReasoning(true);
                currentIsReasoning = true;
              } else if (content) {
                // 不再重置推理状态，只累积响应内容
                responseText += content;
                setCurrentResponse(responseText);
                // 如果是第一个内容，设置不再处于推理阶段
                if (currentIsReasoning) {
                  currentIsReasoning = false;
                  setIsReasoning(false);
                }
              }
            } catch (e) {
              console.error('解析响应出错:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式响应被中止');
        return;
      }
      throw error;
    }
  };

  // 处理重试
  const handleRetry = async (message) => {
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    const previousMessages = displayMessages.slice(0, messageIndex);
    const requestMsgs = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    setDisplayMessages(previousMessages);
    setRequestMessages(requestMsgs);
    
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
          model: selectedModel,
          stream: true
        })
      });

      await handleStreamResponse(response, previousMessages);
    } catch (error) {
      console.error('重试失败:', error);
      setStreaming(false);
      const errorMessage = {
        role: 'assistant',
        content: '重试失败：' + error.message
      };
      setDisplayMessages(prev => [...prev, errorMessage]);
      setRequestMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理新对话
  const handleNewChat = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: '新对话',
      active: true,
      messages: [{ role: "system", content: "You are a helpful assistant." }],
      timestamp: Date.now()
    };

    const updatedConversations = conversations.map(conv => ({
      ...conv,
      active: false
    }));
    updatedConversations.unshift(newConversation);

    setConversations(updatedConversations);
    setDisplayMessages(newConversation.messages);
    setRequestMessages(newConversation.messages);
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
  };

  // 处理对话点击
  const handleConversationClick = (conv) => {
    const updatedConversations = conversations.map(c => ({
      ...c,
      active: c.id === conv.id
    }));
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
    
    setCurrentResponse('');
    setReasoningText('');
    setStreaming(false);
    
    const messages = conv.messages || [{ role: "system", content: "You are a helpful assistant." }];
    setDisplayMessages(messages);
    setRequestMessages(messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // 处理删除对话
  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    
    const updatedConversations = conversations.filter(conv => conv.id !== convId);
    if (updatedConversations.length > 0) {
      if (conversations.find(conv => conv.id === convId)?.active) {
        updatedConversations[0].active = true;
        setDisplayMessages(updatedConversations[0].messages);
        setRequestMessages(updatedConversations[0].messages);
      }
    } else {
      updatedConversations.push({
        id: Date.now().toString(),
        title: '新对话',
        active: true,
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        timestamp: Date.now()
      });
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  // 处理清除所有对话
  const handleClearAll = () => {
    if (window.confirm('确定要清除所有对话吗？')) {
      const newConversation = {
        id: Date.now().toString(),
        title: '新对话',
        active: true,
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        timestamp: Date.now()
      };
      
      setConversations([newConversation]);
      setDisplayMessages(newConversation.messages);
      setRequestMessages(newConversation.messages);
      localStorage.setItem('chatHistory', JSON.stringify([newConversation]));
    }
  };

  // 处理复制
  const handleCopy = async (text) => {
    if (!text) return;
    
    try {
      // 首先尝试使用 clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('复制成功(clipboard API):', text);
        return;
      }

      // 备用方案：使用传统的 execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 防止滚动
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        console.log('复制成功(execCommand):', text);
      } catch (err) {
        console.error('execCommand 复制失败:', err);
      }
      
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('复制失败:', err);
      
      // 最后的备用方案：提示用户手动复制
      window.prompt('请手动复制以下文本:', text);
    }
  };

  // 处理编辑
  const handleEdit = async (message, newContent) => {
    const messageIndex = displayMessages.findIndex(msg => msg === message);
    const previousMessages = displayMessages.slice(0, messageIndex);
    const editedMessage = { role: 'user', content: newContent };
    const updatedMessages = [...previousMessages, editedMessage];
    
    setDisplayMessages(updatedMessages);
    setRequestMessages([...previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })), editedMessage]);
    
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
          model: selectedModel,
          stream: true
        })
      });

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

  // 处理导出
  const handleExport = () => {
    const activeConversation = conversations.find(conv => conv.active);
    if (!activeConversation) return;

    const messages = activeConversation.messages
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        const time = new Date().toLocaleString('zh-CN');
        const role = msg.role === 'user' ? '用户' : 'AI';
        return `${time} ${role}:\n${msg.content}\n`;
      })
      .join('\n');

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

  // Effects
  useEffect(() => {
    if (streaming) {
      scrollToBottom();
    }
  }, [currentResponse, reasoningText, streaming]);

  useEffect(() => {
    if (!streaming) {
      scrollToBottom(true);
      setUserHasScrolled(false);
    }
  }, [displayMessages.length]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  return {
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
    loadingHistory,
    currentTurns: getCurrentTurns(requestMessages),
    highlightedMessageId
  };
}; 