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

// 配置 CORS - 简单版本
app.use(cors({
  origin: '*',  // 允许所有来源
  methods: ['GET', 'POST'],
  credentials: false  // 关闭 credentials，因为使用 * 时不能为 true
}));

app.use(limiter);
app.use(express.json());

// 添加新的 API 配置
const API_CONFIGS = {
  'deepseek-chat': {
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY
  },
  'deepseek-reasoner': {
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY
  },
  'deepseek-v3-241226': {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: process.env.VOLCES_API_KEY
  },
  'deepseek-r1-250120': {
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: process.env.VOLCES_API_KEY
  }
};

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
  const model = req.body.model || 'deepseek-chat';
  const apiConfig = API_CONFIGS[model];
  const requestId = Math.random().toString(36).substring(7);

  // 请求开始日志
  console.log('\n=== 请求开始 ===', {
    requestId,
    timestamp: new Date().toISOString(),
    model
  });

  // 详细的请求信息日志
  console.log('\n[请求详情]', {
    requestId,
    model,
    apiEndpoint: apiConfig.baseURL,
    messages: req.body.messages?.map(msg => ({
      role: msg.role,
      content: msg.content?.length > 50 
        ? `${msg.content.slice(0, 50)}...` 
        : msg.content,
      length: msg.content?.length
    })),
    totalMessages: req.body.messages?.length,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ***' + (apiConfig.apiKey || '').slice(-4)
    }
  });

  try {
    // API 请求日志
    console.log('\n[发送请求]', {
      requestId,
      url: apiConfig.baseURL,
      method: 'POST',
      model,
      stream: true
    });

    const response = await fetch(apiConfig.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: req.body.messages,
        stream: true
      })
    });

    // 响应状态日志
    console.log('\n[响应状态]', {
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 收集完整响应
    let fullContent = '';
    let fullReasoningContent = '';
    let chunkCount = 0;
    
    // 设置响应头和处理流式响应
    const reader = response.body.getReader();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // 完整响应日志
        console.log('\n[响应完成]', {
          requestId,
          timestamp: new Date().toISOString(),
          totalChunks: chunkCount,
          contentLength: fullContent.length,
          reasoningLength: fullReasoningContent.length,
          content: fullContent.length > 100 
            ? `${fullContent.slice(0, 100)}...` 
            : fullContent,
          reasoning_content: fullReasoningContent.length > 100 
            ? `${fullReasoningContent.slice(0, 100)}...` 
            : fullReasoningContent
        });
        console.log('\n=== 请求结束 ===\n');
        break;
      }
      
      chunkCount++;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              const reasoningContent = parsed.choices[0]?.delta?.reasoning_content;
              
              if (content) fullContent += content;
              if (reasoningContent) fullReasoningContent += reasoningContent;
            } catch (e) {
              console.error('解析响应出错:', e);
            }
          }
          res.write(line + '\n');
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    // 错误日志
    console.error('\n[错误]', {
      requestId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      },
      apiEndpoint: apiConfig.baseURL
    });
    console.log('\n=== 请求异常结束 ===\n');

    res.status(500).json({ 
      error: '服务器错误',
      message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://${require('os').networkInterfaces()['en0']?.find(x => x.family === 'IPv4')?.address || 'localhost'}:${PORT}`);
}); 