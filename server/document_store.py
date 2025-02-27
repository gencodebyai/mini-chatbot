from langchain_community.document_loaders import DirectoryLoader, TextLoader, PyPDFLoader, UnstructuredWordDocumentLoader
from langchain_community.document_loaders.markdown import UnstructuredMarkdownLoader
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_community.document_loaders.word_document import UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import OpenAI
from langchain_community.vectorstores import FAISS
import os
from dotenv import load_dotenv
import numpy as np

# 加载环境变量
load_dotenv()

class ArkEmbeddings:
    def __init__(self, api_key, base_url):
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
    
    def __call__(self, text):
        """使类实例可调用，用于兼容 FAISS 的接口"""
        if isinstance(text, str):
            return self.embed_query(text)
        elif isinstance(text, list):
            return self.embed_documents(text)
        else:
            raise ValueError(f"Unsupported input type: {type(text)}")
    
    def embed_documents(self, texts):
        """将文档转换为向量"""
        print(f"\n正在生成 {len(texts)} 个文档的向量...")
        # 分批处理，每批最多 10 个文档
        batch_size = 10
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            print(f"处理第 {i//batch_size + 1} 批，共 {len(batch_texts)} 个文档")
            
            try:
                response = self.client.embeddings.create(
                    model="ep-20250227223958-wb4sk",
                    input=batch_texts,
                    encoding_format="float"
                )
                batch_embeddings = [embedding.embedding for embedding in response.data]
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                print(f"处理批次 {i//batch_size + 1} 时出错: {str(e)}")
                raise
        
        print(f"向量生成完成，共 {len(all_embeddings)} 个向量")
        return all_embeddings
    
    def embed_query(self, text):
        """将查询转换为向量"""
        response = self.client.embeddings.create(
            model="ep-20250227223958-wb4sk",
            input=[text],
            encoding_format="float"
        )
        return response.data[0].embedding

class DocumentStore:
    def __init__(self):
        self.embeddings = ArkEmbeddings(
            api_key=os.getenv('ARK_API_KEY'),
            base_url="https://ark.cn-beijing.volces.com/api/v3"
        )
        self.vector_store = None
        
    def load_documents(self, directory_path):
        print(f"\n文档处理步骤:")
        print(f"1. 加载目录: {directory_path}")
        # 加载文档
        loaders = {
            '**/*.txt': TextLoader,
            '**/*.pdf': PyPDFLoader,
            '**/*.doc': UnstructuredWordDocumentLoader,
            '**/*.docx': UnstructuredWordDocumentLoader,
            '**/*.md': UnstructuredMarkdownLoader,
        }
        documents = []
        for glob_pattern, loader_cls in loaders.items():
            try:
                loader = DirectoryLoader(
                    directory_path,
                    glob=glob_pattern,
                    loader_cls=loader_cls
                )
                docs = loader.load()
                if docs:
                    print(f"成功加载 {len(docs)} 个 {glob_pattern} 文件")
                    documents.extend(docs)
            except Exception as e:
                print(f"加载 {glob_pattern} 文件时出错: {str(e)}")
                continue
        
        if not documents:
            raise ValueError("没有成功加载任何文档")
        
        print(f"2. 文档加载完成: {len(documents)} 个文档")
        
        # 切分文档
        try:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            texts = text_splitter.split_documents(documents)
            print(f"3. 文档切分完成: {len(texts)} 个文本块")
            
            if not texts:
                raise ValueError("文档切分后没有得到任何文本块")
            
            # 检查文本内容
            print("\n文本块示例:")
            for i, text in enumerate(texts[:2]):
                print(f"\n块 {i+1}:")
                print(text.page_content[:200] + "...")
            
            # 创建向量存储
            print("\n开始创建向量存储...")
            self.vector_store = FAISS.from_documents(texts, self.embeddings)
            
            # 验证向量存储
            if not self.vector_store:
                raise ValueError("向量存储创建失败")
            
            # 测试向量存储
            test_results = self.vector_store.similarity_search("测试", k=1)
            if test_results:
                print("向量存储测试成功")
            
            print("4. 向量存储创建成功\n")
            return True
            
        except ValueError as e:
            print(f"错误: {str(e)}")
            return False
        except Exception as e:
            print(f"处理文档时出错: {str(e)}")
            return False

    def search(self, query, k=3):
        if not self.vector_store:
            return []
        return self.vector_store.similarity_search(query, k=k)

    def clear(self):
        """清空向量存储"""
        self.vector_store = None
        print("向量存储已清空")