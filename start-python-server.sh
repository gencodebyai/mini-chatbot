#!/bin/bash

cd server

# 检查 Python 虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "Installing Python dependencies..."
pip install "flask[async]" flask-cors langchain-community langchain openai faiss-cpu python-dotenv "httpx[socks]" tiktoken
pip install pypdf unstructured python-docx markdown
brew install libmagic  # macOS
# 检查 documents 目录是否存在
if [ ! -d "documents" ]; then
    echo "Creating documents directory..."
    mkdir documents
fi

# 启动 Flask 服务器
echo "Starting Flask server..."
python app.py 