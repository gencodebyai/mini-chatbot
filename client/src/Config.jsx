// 测试用配置
export const baseURL = 'https://api.deepseek.com';
export const apiKey = 'your-api-key';
export const modelName = 'deepseek-chat';  // 添加模型名称
export const maxHistoryLength = 10;  // 添加最大对话长度配置

// API 地址
export const serverURL = process.env.NODE_ENV === 'production' 
  ? 'https://mini-chatbot-zty6.onrender.com/'  // 替换为你的 Render 应用 URL
  : 'http://localhost:3000';  // 本地开发时使用

// 本地调试用 