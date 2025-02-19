// 测试用配置
export const baseURL = 'https://api.deepseek.com';
export const apiKey = 'your-api-key';
export const modelOptions = [
  'deepseek-chat',
  'deepseek-reasoner'
];
export const maxHistoryLength = 10;  // 添加最大对话长度配置

// API 地址
export const serverURL = process.env.NODE_ENV === 'production' 
  ? 'https://mini-chatbot-zty6.onrender.com'  // 移除末尾的斜杠
  : 'http://localhost:3000';  // 本地开发时使用

// 本地调试用 