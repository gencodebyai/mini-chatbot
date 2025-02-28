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
import hashlib
from pathlib import Path
import json

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
        self.index_dir = Path("faiss_index")  # 索引存储目录
        self.file_hashes = {}  # 文件路径到哈希的映射
        
        # 加载已有索引
        self.index_dir.mkdir(exist_ok=True)
        self._load_existing_hashes()
        
    def _file_hash(self, file_path):
        """计算文件的 SHA256 哈希"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    def _load_existing_hashes(self):
        """加载已有的哈希记录"""
        hash_file = self.index_dir / "file_hashes.json"
        if hash_file.exists():
            with open(hash_file) as f:
                self.file_hashes = json.load(f)

    def _save_hashes(self):
        """保存哈希记录"""
        hash_file = self.index_dir / "file_hashes.json"
        with open(hash_file, "w") as f:
            json.dump(self.file_hashes, f)

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
        has_changes = False
        
        for glob_pattern, loader_cls in loaders.items():
            try:
                loader = DirectoryLoader(
                    directory_path,
                    glob=glob_pattern,
                    loader_cls=loader_cls
                )
                docs = loader.load()
                if docs:
                    # 计算文件哈希
                    for doc in docs:
                        file_path = doc.metadata['source']
                        current_hash = self._file_hash(file_path)
                        
                        # 检查哈希是否变化
                        if self.file_hashes.get(file_path) != current_hash:
                            has_changes = True
                            self.file_hashes[file_path] = current_hash
                            documents.append(doc)
                        else:
                            print(f"文件未修改: {file_path}")
            except Exception as e:
                print(f"加载 {glob_pattern} 文件时出错: {str(e)}")
                continue
        
        if not documents:
            raise ValueError("没有成功加载任何文档")
        
        # 如果有文件变化才重新生成索引
        if has_changes:
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            texts = text_splitter.split_documents(documents)
            
            # 创建并保存向量存储
            self.vector_store = FAISS.from_documents(texts, self.embeddings)
            self._save_vector_store()
            self._save_hashes()
        else:
            # 加载已有索引
            self._load_vector_store()
        
        print("4. 向量存储处理完成\n")
        return True

    def _save_vector_store(self):
        """保存向量存储到磁盘"""
        if self.vector_store:
            index_path = self.index_dir / "current_index"
            self.vector_store.save_local(index_path)
            print(f"向量索引已保存到: {index_path}")

    def _load_vector_store(self):
        """从磁盘加载向量存储"""
        index_path = self.index_dir / "current_index"
        if index_path.exists():
            self.vector_store = FAISS.load_local(
                index_path, 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            print(f"已加载缓存的向量索引: {index_path}")
        else:
            raise ValueError("没有找到缓存的向量索引")

    def search(self, query, k=3):
        if not self.vector_store:
            return []
        return self.vector_store.similarity_search(query, k=k)

    def clear(self):
        """清空向量存储"""
        self.vector_store = None
        # 清空缓存
        self.file_hashes = {}
        if self.index_dir.exists():
            for f in self.index_dir.glob("*"):
                f.unlink()
        print("向量存储已清空")