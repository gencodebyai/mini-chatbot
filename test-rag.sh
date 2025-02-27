#!/bin/bash

cd server

# 检查并激活虚拟环境
if [ ! -d "venv" ]; then
    echo "Python virtual environment not found. Please run start-python-server.sh first."
    exit 1
fi

source venv/bin/activate

# 测试 Flask 服务器是否运行
echo "Testing Flask server..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000)

if [ $response -eq 000 ]; then
    echo "Error: Flask server is not running. Please start the server first."
    exit 1
fi

# 创建简单的测试文档
echo "Creating test document..."
echo "This is a test document." > documents/test.txt

# 测试文档上传
echo "Testing document upload..."
curl -X POST -F "documents=@documents/test.txt" http://localhost:5000/upload

# 测试聊天接口
echo -e "\nTesting chat endpoint with deepseek-r1-250120 model..."
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is in the test document?"}
    ],
    "model": "deepseek-r1-250120"
  }'

# 测试推理功能
echo -e "\nTesting reasoning capability..."
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "分析这个文档的主要内容是什么？"}
    ],
    "model": "deepseek-r1-250120"
  }'

echo -e "\nTest complete." 