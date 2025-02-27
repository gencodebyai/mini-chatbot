const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');
const path = require('path');

const RAG_SERVICE_URL = 'http://127.0.0.1:5001';

async function testRAGService() {
    console.log('\n=== 开始测试 RAG 服务 ===\n');

    try {
        // 1. 测试文档上传
        console.log('1. 测试文档上传...');
        const testDoc = `这是一个测试文档。
用于测试RAG系统的功能。
包含一些简单的信息：
1. Python是一种编程语言
2. Flask是一个Web框架
3. RAG是检索增强生成的缩写`;

        // 创建测试文件
        await fs.writeFile('test.txt', testDoc, 'utf8');
        
        // 创建 FormData 并添加文件
        const form = new FormData();
        const fileBuffer = await fs.readFile('test.txt');
        form.append('documents', fileBuffer, {
            filename: 'test.txt',
            contentType: 'text/plain'
        });

        // 上传文件
        const uploadResponse = await axios.post(`${RAG_SERVICE_URL}/upload`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('上传响应:', uploadResponse.data);

        // 2. 测试聊天功能
        console.log('\n2. 测试聊天功能...');
        const testQueries = [
            "Python是什么？",
            "Flask的作用是什么？",
            "RAG是什么技术？"
        ];

        for (const query of testQueries) {
            console.log(`\n发送查询: "${query}"`);
            const response = await axios.post(
                `${RAG_SERVICE_URL}/api/chat`,
                {
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: query }
                    ],
                    model: "deepseek-r1-250120",
                    stream: true
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream'
                    },
                    responseType: 'stream'
                }
            );

            // 处理流式响应
            response.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            console.log('\n--- 响应结束 ---\n');
                        } else {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.choices?.[0]?.delta?.content) {
                                    process.stdout.write(parsed.choices[0].delta.content);
                                } else if (parsed.choices?.[0]?.delta?.reasoning_content) {
                                    process.stdout.write(parsed.choices[0].delta.reasoning_content);
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }
            });

            // 等待响应完成
            await new Promise(resolve => response.data.on('end', resolve));
        }

        // 清理测试文件
        await fs.unlink('test.txt');
        console.log('\n=== RAG 服务测试完成 ===\n');

    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testRAGService(); 