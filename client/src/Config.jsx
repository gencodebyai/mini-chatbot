// 测试用配置
export const baseURL = 'https://api.deepseek.com';
export const apiKey = 'your-api-key';
export const modelName = 'deepseek-chat';  // 添加模型名称
export const maxHistoryLength = 10;  // 添加最大对话长度配置

// API 地址
export const serverURL = process.env.NODE_ENV === 'production' 
  ? 'https://你的render域名.onrender.com'  // 生产环境使用 Render 的地址
  : 'http://localhost:3000';  // 开发环境使用本地地址

// 本地调试用 