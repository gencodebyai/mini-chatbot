require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');

const app = express();

// 添加速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});

// 配置 CORS
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://gencodebyai.github.io'
    ];
    
    // 允许来自允许列表的请求
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(limiter);
app.use(express.json());

// 从环境变量获取 API Key
const API_KEY = process.env.DEEPSEEK_API_KEY;

// 添加一个测试端点
app.get('/api/test', (req, res) => {
  console.log('收到测试请求');
  res.json({ 
    message: '后端服务正常运行',
    env: process.env.NODE_ENV,
    apiKey: process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'
  });
});

app.post('/api/chat', async (req, res) => {
  console.log('收到聊天请求');
  console.log('环境变量:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    API_KEY: process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'
  });
  
  // 添加详细的请求日志
  console.log('请求详情:', {
    model: req.body.model,
    messagesCount: req.body.messages?.length,
    messages: req.body.messages?.map(msg => ({
      role: msg.role,
      contentPreview: msg.content?.slice(0, 50) + (msg.content?.length > 50 ? '...' : '')
    }))
  });

  try {
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: API_KEY
    });

    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: '无效的消息格式' });
    }

    // 添加 API 请求日志
    console.log('发送到 DeepSeek 的请求:', {
      model: req.body.model,
      stream: true,
      messages: req.body.messages
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: req.body.model || 'deepseek-chat',
        messages: req.body.messages,
        stream: true
      })
    });

    // 添加响应状态日志
    console.log('DeepSeek API 响应状态:', response.status);

    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 直接转发流式响应
    const reader = response.body.getReader();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      res.write(new TextDecoder().decode(value));
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('API 请求错误:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ 
      error: '服务器错误',
      message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 