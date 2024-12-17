import sys
import os
# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Add the parent directory to system path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from app.config.aws_config import AWSConfig
from app.core.data_processor import DataProcessor
from app.core.search_engine import SearchEngine
from app.core.qa_system import QASystem

from dotenv import load_dotenv
import asyncio
from typing import Dict, List
import pandas as pd
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get actual username from environment
username = os.getenv('USERNAME', 'default_user')
temp_dir = Path(os.getenv('TEMP', f'C:/Users/sorak/AppData/Local/Temp'))

class MedicalQASystem:
    def __init__(self):
        try:
            # Verify environment variables
            required_vars = [
                'OPENAI_API_KEY', 
                'PINECONE_API_KEY', 
                'PINECONE_ENV',
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY'
            ]
            
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            if missing_vars:
                raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
            
            # Import after adding project root to Python path
            from app.config.aws_config import AWSConfig
            from app.core.data_processor import DataProcessor
            from app.core.search_engine import SearchEngine
            from app.core.qa_system import QASystem
            
            self.aws_config = AWSConfig()
            self.data_processor = DataProcessor()
            self.search_engine = SearchEngine(
                api_key=os.getenv('OPENAI_API_KEY'),
                pinecone_api_key=os.getenv('PINECONE_API_KEY'),
                pinecone_env=os.getenv('PINECONE_ENV')
            )
            self.qa_system = QASystem(
                search_engine=self.search_engine,
                openai_api_key=os.getenv('OPENAI_API_KEY')
            )
            logger.info("Successfully initialized MedicalQASystem")
            
        except ImportError as e:
            logger.error(f"Failed to import required modules: {e}")
            logger.error("Please ensure all required files are in the correct directory structure")
            logger.error("Required structure:")
            logger.error("bcankend/")
            logger.error("  ├── aws_config.py")
            logger.error("  ├── data_processor.py")
            logger.error("  ├── search_engine.py")
            logger.error("  ├── qa_system.py")
            logger.error("  └── medical_qa.py")
            raise
        except Exception as e:
            logger.error(f"Error initializing MedicalQASystem: {e}")
            raise

    async def load_and_process_data(self):
        """S3에서 데이터를 가져와 처리하기"""
        try:
            local_path = temp_dir / 'medical_data.csv'
            logger.info(f"Downloading data to {local_path}")
            
            self.aws_config.download_file_from_s3(
                'medical-rag-test', 
                'medical-rag-test.csv', 
                local_path
            )
            
            records = self.data_processor.process_file(local_path)
            logger.info(f"Processed {len(records)} records from S3")
            return records
            
        except Exception as e:
            logger.error(f"Error loading and processing data: {e}")
            raise

    async def index_data(self, records: List['MedicalRecord'], use_cache: bool = True):
        """문서 데이터를 Pinecone에 인덱싱"""
        try:
            await self.search_engine.process_documents(records)
            logger.info(f"Indexed {len(records)} documents in Pinecone")
        except Exception as e:
            logger.error(f"Error indexing data: {e}")
            raise

    async def ask_question(self, question: str) -> str:
        """사용자 질문에 대해 GPT 답변 생성"""
        try:
            response = await self.qa_system.retrieve_and_answer(question)
            return response
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return "질문에 대한 답변을 처리하지 못했습니다."



async def main():
    try:
        qa_system = MedicalQASystem()
        records = await qa_system.load_and_process_data()
        await qa_system.index_data(records)

        # 질문 처리 테스트
        question = "강영남 교수님의 방사선 치료 스타일이 궁금해요. 어떤 분이신가요?"
        response = await qa_system.ask_question(question)
        print(response)
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())