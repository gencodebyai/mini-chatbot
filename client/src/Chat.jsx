import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { baseURL, apiKey, modelName, maxHistoryLength, serverURL } from './Config'

function Chat() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 计算当前对话轮次
  const getCurrentTurns = (msgs) => {
    // 过滤掉系统消息，计算用户消息的数量（每轮对话由一个用户消息构成）
    return msgs.filter(msg => msg.role === 'user').length
  }

  // 添加测试函数
  const testConnection = async () => {
    try {
      console.log('测试连接到:', serverURL);
      const response = await axios.get(`${serverURL}/api/test`);
      console.log('测试响应:', response.data);
    } catch (error) {
      console.error('测试失败:', error.response?.data || error.message);
    }
  };

  // 在组件加载时测试连接
  useEffect(() => {
    testConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = { role: 'user', content: input }
    console.log('准备发送消息到:', serverURL);
    console.log('消息内容:', newMessage);
    
    // 保持系统消息，并限制历史消息数量
    let updatedMessages = [...messages, newMessage]
    const currentTurns = getCurrentTurns(updatedMessages)
    
    if (currentTurns > maxHistoryLength) {
      // 保留系统消息和最新的 maxHistoryLength 轮对话
      const systemMessage = updatedMessages[0]
      const recentMessages = []
      let turns = 0
      
      // 从后往前遍历消息，保留最新的 maxHistoryLength 轮对话
      for (let i = updatedMessages.length - 1; i > 0; i--) {
        recentMessages.unshift(updatedMessages[i])
        if (updatedMessages[i].role === 'user') {
          turns++
          if (turns === maxHistoryLength) break
        }
      }
      
      updatedMessages = [systemMessage, ...recentMessages]
    }
    
    setMessages(updatedMessages)
    setInput('')

    try {
      console.log('发送请求...');
      const response = await axios.post(`${serverURL}/api/chat`, {
        messages: updatedMessages
      })
      console.log('收到响应:', response.data);
      
      setMessages(prev => [...prev, response.data])
    } catch (error) {
      console.error('请求失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '发生错误：' + (error.response?.data?.message || error.message)
      }])
    }
  }

  // 计算当前对话轮次
  const currentTurns = getCurrentTurns(messages)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Mini Chatbot</h1>
      <button 
        onClick={testConnection}
        style={{ 
          marginBottom: '10px',
          padding: '5px 10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        测试连接
      </button>
      <div style={{ 
        marginBottom: '10px', 
        textAlign: 'right', 
        color: currentTurns >= maxHistoryLength ? '#ff4444' : '#666'
      }}>
        对话轮次: {currentTurns}/{maxHistoryLength}
      </div>
      <div style={{ 
        marginBottom: '20px', 
        height: '500px',
        border: '1px solid #ccc', 
        borderRadius: '5px',
        overflow: 'auto',
        padding: '10px',
        scrollBehavior: 'smooth'
      }}>
        {messages.length === 1 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '220px' }}>
            开始对话吧...
          </div>
        ) : (
          <>
            {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
              <div key={index} style={{ 
                margin: '10px', 
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <div style={{
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  maxWidth: (() => {
                    const length = msg.content.length;
                    if (length < 20) return '30%';
                    if (length < 50) return '50%';
                    if (length < 100) return '70%';
                    return '85%';
                  })(),
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: (() => {
                    const length = msg.content.length;
                    if (length < 20) return '1.1em';
                    if (length < 50) return '1em';
                    return '0.95em';
                  })(),
                  lineHeight: '1.4'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
      </form>
    </div>
  )
}

export default Chat 