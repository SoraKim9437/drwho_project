from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict
import asyncio
import json
from collections import Counter
import os
import logging
import pickle
import re
from .data_processor import DoctorProfile

logger = logging.getLogger(__name__)

class SearchEngine:
    def __init__(self, api_key: str, pinecone_api_key: str, pinecone_env: str):
        """검색 엔진 초기화"""
        try:
            self.openai_client = OpenAI(api_key=api_key)
            self.index_name = "medical-reviews"
            
            self.pc = Pinecone(api_key=pinecone_api_key)
            
            if self.index_name not in self.pc.list_indexes().names():
                spec = ServerlessSpec(
                    cloud='aws',
                    region='us-east-1'
                )
                
                logger.info(f"Creating new index '{self.index_name}' in region us-east-1")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,
                    metric='cosine',
                    spec=spec
                )
            
            self.index = self.pc.Index(self.index_name)
            logger.info("Successfully initialized SearchEngine")
            
        except Exception as e:
            logger.error(f"Error initializing SearchEngine: {e}")
            raise

    async def process_documents(self, records: List[DoctorProfile], use_cache: bool = False):
        """의사 프로필 데이터를 Pinecone에 인덱싱"""
        cache_file = "embeddings_cache.pkl"
        
        try:
            if use_cache and os.path.exists(cache_file):
                logger.info("Using cached embeddings")
                return
            
            for record in records:
                try:
                    # 검색 가능한 텍스트 생성
                    profile_text = f"""
                    의사명: {record.doctor_name}
                    병원: {record.hospital}
                    진료과: {record.department}
                    전문 분야: {record.specialty}
                    주요 진료: {record.main_focus}
                    
                    학력:
                    {record.education}
                    
                    경력:
                    {record.experience}
                    
                    진료 스타일:
                    {record.treatment_style}
                    
                    특징:
                    {record.uniqueness}
                    
                    환자 평가:
                    {record.patient_evaluation}
                    
                    상담 스타일:
                    {record.consultation_style}
                    
                    키워드:
                    {record.keywords}
                    """
                    
                    # 임베딩 생성
                    embedding = await self.get_embedding(profile_text)
                    
                    # 메타데이터 준비
                    metadata = {
                        "id": record.id,
                        "doctor_name": record.doctor_name,
                        "hospital": record.hospital,
                        "department": record.department,
                        "specialty": record.specialty,
                        "main_focus": record.main_focus,
                        "treatment_style": record.treatment_style,
                        "consultation_style": record.consultation_style,
                        "keywords": record.keywords,
                        "profile_text": profile_text
                    }
                    
                    # 벡터 업서트
                    await asyncio.to_thread(
                        self.index.upsert,
                        vectors=[(f"doc_{record.id}", embedding, metadata)]
                    )
                    
                    logger.info(f"Successfully processed profile for Dr. {record.doctor_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing record {record.id}: {e}")
                    continue
            
            with open(cache_file, 'wb') as f:
                pickle.dump("cached", f)
                
            logger.info("Completed embeddings and saved cache")
            
        except Exception as e:
            logger.error(f"Error processing documents: {e}")
            raise

    async def get_embedding(self, text: str) -> List[float]:
        """OpenAI API를 사용하여 텍스트의 임베딩 벡터 생성"""
        try:
            response = await asyncio.to_thread(
                self.openai_client.embeddings.create,
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    async def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """의사 프로필 검색 수행"""
        try:
            query_embedding = await self.get_embedding(query)
            
            results = await asyncio.to_thread(
                self.index.query,
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            return [match["metadata"] for match in results.get("matches", [])]
            
        except Exception as e:
            logger.error(f"Error searching: {e}")
            raise