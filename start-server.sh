#!/bin/bash

# 安装前端依赖并构建
cd client
npm install
npm run build

# 安装后端依赖并启动服务器
cd ../server
npm install

# 回到根目录启动 Python RAG 服务器
cd ..
#./start-python-server.sh &
#PYTHON_PID=$!

# 等待 Python 服务器启动
sleep 2

# 启动 Node.js 服务器
cd server
node index.js &
NODE_PID=$!

# 捕获 SIGINT 信号（Ctrl+C）
trap 'kill $PYTHON_PID $NODE_PID; exit' SIGINT

# 等待任一进程结束
wait

# 启动 Flask 服务器
echo "启动 Flask 服务器..."
cd server
source venv/bin/activate
python app.py &
FLASK_PID=$!

# 等待 Flask 服务器启动
echo "等待 Flask 服务器启动..."
sleep 2

# 运行测试
echo "运行测试..."
python test_app.py

# 清理
kill $FLASK_PID
deactivate 