from flask import Flask, request, jsonify, Response, stream_with_context, make_response
from flask_cors import CORS
import os
from document_store import DocumentStore
from werkzeug.utils import secure_filename
import json
from openai import OpenAI
from dotenv import load_dotenv
import logging
from logging import Formatter, StreamHandler

# 配置日志
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 创建自定义格式化器
class CustomFormatter(Formatter):
    def format(self, record):
        # 保存原始消息
        original_msg = record.msg
        separator = record.__dict__.get('separator', '')
        
        # 设置基本格式
        record.msg = f"{original_msg}\n{separator}" if separator else original_msg
        
        # 调用父类的 format 方法
        return super().format(record)

# 创建处理器并设置格式化器
handler = StreamHandler()
handler.setFormatter(CustomFormatter(
    fmt='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))
logger.addHandler(handler)

# 自定义日志格式
def log_separator(length=80):
    return "-" * length

class CustomLogger:
    @staticmethod
    def request(method, path, data=None):
        separator = f"""请求详情:
方法: {method}
路径: {path}
数据: {json.dumps(data, ensure_ascii=False, indent=2) if data else 'None'}
{log_separator()}"""
        
        logger.info(
            "收到请求",
            extra={'separator': separator}
        )

    @staticmethod
    def chat_completion(query, docs_count, context):
        separator = f"""查询详情:
用户问题: {query}
找到文档数: {docs_count}

相关文档内容:
{context}
{log_separator()}"""
        
        logger.info(
            "处理聊天请求",
            extra={'separator': separator}
        )

    @staticmethod
    def response_complete(query, full_response):
        separator = f"""响应详情:
用户问题: {query}
完整响应:
{full_response}
{log_separator()}"""
        
        logger.info(
            "生成响应完成",
            extra={'separator': separator}
        )

# 加载环境变量
load_dotenv()
if os.getenv('ARK_API_KEY'):
    logger.info("ARK_API_KEY 已配置")
else:
    logger.warning("ARK_API_KEY 未配置")
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",  # 允许所有源
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": "*",  # 允许所有头部
        "expose_headers": ["Content-Type", "X-Total-Count"],
        "supports_credentials": False,
        "max_age": 600
    }
})

# 配置文件上传
UPLOAD_FOLDER = './documents'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 初始化文档存储和 OpenAI 客户端
doc_store = DocumentStore()
client = OpenAI(
    api_key=os.getenv("ARK_API_KEY"),  # 从环境变量读取 ARK_API_KEY
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    logger.info("\n=== 文件上传请求开始 ===")
    if 'documents' not in request.files:
        logger.error("错误: 请求中没有文件")
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('documents')
    logger.info(f"收到 {len(files)} 个文件")
    uploaded_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            logger.info(f"保存文件: {filename} -> {file_path}")
            file.save(file_path)
            uploaded_files.append(filename)
    
    if uploaded_files:
        # 重新加载文档库
        try:
            logger.info("\n开始处理文档...")
            doc_store.load_documents(app.config['UPLOAD_FOLDER'])
            logger.info(f"文档处理成功: {uploaded_files}")
            logger.info("=== 文件上传请求完成 ===\n")
            return jsonify({
                'message': '文件上传成功',
                'files': uploaded_files
            })
        except Exception as e:
            error_msg = f"文档处理失败: {str(e)}"
            logger.error(f"错误: {error_msg}")
            logger.error("=== 文件上传请求失败 ===\n")
            return jsonify({'error': error_msg}), 500
    
    logger.error("错误: 没有有效的文件被上传")
    logger.error("=== 文件上传请求失败 ===\n")
    return jsonify({'error': '没有上传有效的文件'}), 400

@app.before_request
def log_request_info():
    if request.path != '/api/test':  # 忽略测试端点的日志
        logger.info(f"收到请求: {request.method} {request.path}")

@app.after_request
def after_request(response):
    # 添加 CORS 头
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', '*')
    response.headers.add('Access-Control-Allow-Methods', '*')
    return response

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # 设置 CORS 头
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'  # 禁用 Nginx 缓冲（如果有的话）
    }

    if request.method == 'OPTIONS':
        logger.debug("处理 OPTIONS 请求")
        return ('', 204, headers)

    try:
        data = request.json
        CustomLogger.request(request.method, request.path, data)
        messages = data['messages']
        model = data.get('model', 'deepseek-r1-250120')
        query = messages[-1]['content']
        
        # 检索相关文档
        relevant_docs = doc_store.search(query)
        
        # 构建并记录上下文
        context = "\n\n".join([f"文档片段 {i+1}:\n{doc.page_content}" for i, doc in enumerate(relevant_docs)])
        CustomLogger.chat_completion(query, len(relevant_docs), context)
        
        # 构建系统提示词
        system_prompt = f"""你好!我是一个专业的AI助手,很高兴为你提供帮助。我会仔细阅读以下参考文档来回答你的问题:

参考文档:
{context}

在回答过程中,我会:
- 优先使用文档中的信息进行回答
- 用简洁清晰的语言表达
- 如果需要补充额外信息,我会明确标注出哪些内容来自文档,哪些是我的补充说明

如果文档中没有找到相关信息,我会坦诚地告诉你。请问有什么我可以帮你的吗?"""
        
        # 更新消息列表中的系统消息
        if messages[0]['role'] == 'system':
            messages[0]['content'] = system_prompt
        else:
            messages.insert(0, {"role": "system", "content": system_prompt})
        
        def generate():
            full_response = []
            try:
                # 发送初始推理内容
                yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': '正在分析相关文档...\n'}}]})}\n\n".encode('utf-8')
                yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': f'找到 {len(relevant_docs)} 个相关文档片段。\n'}}]})}\n\n".encode('utf-8')
                
                # 可以选择性地显示找到的文档片段
                if relevant_docs:
                    yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': '相关文档内容：\n'}}]})}\n\n".encode('utf-8')
                    for i, doc in enumerate(relevant_docs):
                        yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': f'片段 {i+1}：{doc.page_content}\n'}}]})}\n\n".encode('utf-8')
                    yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': '\n基于以上文档回答：\n'}}]})}\n\n".encode('utf-8')

                # 调用 OpenAI API 进行流式响应
                logger.debug("调用 OpenAI API")
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True
                )

                for chunk in response:
                    logger.debug("收到 chunk: %s", chunk)
                    if hasattr(chunk.choices[0].delta, 'reasoning_content') and chunk.choices[0].delta.reasoning_content:
                        content = chunk.choices[0].delta.reasoning_content
                        yield f"data: {json.dumps({'choices': [{'delta': {'reasoning_content': chunk.choices[0].delta.reasoning_content}}]})}\n\n".encode('utf-8')
                        full_response.append(content)
                    elif hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk.choices[0].delta.content}}]})}\n\n".encode('utf-8')
                        full_response.append(content)

                yield b"data: [DONE]\n\n"
                CustomLogger.response_complete(query, ''.join(full_response))
            except Exception as e:
                logger.error("生成响应流时出错: %s", str(e))
                yield f"data: {json.dumps({'error': str(e)})}\n\n".encode('utf-8')
                yield b"data: [DONE]\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers=headers,
            direct_passthrough=True
        )

    except Exception as e:
        logger.error(f"处理请求时出错: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    print(f"错误: {str(error)}")
    return jsonify({
        "error": str(error),
        "type": type(error).__name__
    }), getattr(error, 'code', 500)

@app.route('/api/test')
def test():
    """测试端点"""
    return jsonify({
        'status': 'ok',
        'message': 'Flask 服务器正在运行',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    # 使用不同的端口，避免与系统服务冲突
    app.run(debug=True, port=5001, host='127.0.0.1')  