const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  console.log('收到请求，baseURL:', req.body.baseURL)  // 添加调试日志
  console.log('消息数量:', req.body.messages.length)
  console.log('使用模型:', req.body.modelName)  // 添加模型名称日志

  try {
    const openai = new OpenAI({
      baseURL: req.body.baseURL,
      apiKey: req.body.apiKey
    });

    const completion = await openai.chat.completions.create({
      messages: req.body.messages,
      model: req.body.modelName,
      temperature: 0.7
    });

    res.json(completion.choices[0].message);
  } catch (error) {
    console.error('API 请求错误:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 