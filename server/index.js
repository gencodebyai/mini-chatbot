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
  console.log('请求体:', {
    messagesCount: req.body.messages?.length,
    firstMessage: req.body.messages?.[0]
  });

  console.log('收到请求，消息数量:', req.body.messages.length);

  try {
    // 使用后端的 API Key，而不是从前端传递
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: API_KEY
    });

    // 添加请求验证
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: '无效的消息格式' });
    }

    const completion = await openai.chat.completions.create({
      messages: req.body.messages,
      model: 'deepseek-chat',
      temperature: 0.7
    });

    // 添加响应处理
    const response = completion.choices[0].message;
    
    // 可以添加响应日志
    console.log('API响应成功');

    res.json(response);
  } catch (error) {
    console.error('API 请求错误:', error.response?.data || error.message);
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