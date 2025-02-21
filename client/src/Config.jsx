// 测试用配置
export const baseURL = 'https://api.deepseek.com';
export const apiKey = 'your-api-key';
export const modelOptions = [
  'deepseek-v3-241226',
  'deepseek-r1-250120',
  'deepseek-chat',
  'deepseek-reasoner'
];
export const maxHistoryLength = 10;  // 添加最大对话长度配置

// API 地址
export const serverURL = process.env.NODE_ENV === 'production' 
  ? 'https://mini-chatbot-zty6.onrender.com'
  : `http://${window.location.hostname}:3000`;  // 使用当前主机名，包括 localhost 和 IP

// 本地调试用 