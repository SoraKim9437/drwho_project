import asyncio
from openai import OpenAI
from typing import Dict, List
import logging
from .search_engine import SearchEngine

logger = logging.getLogger(__name__)

class QASystem:
    def __init__(self, search_engine: SearchEngine, openai_api_key: str):
        """QA 시스템 초기화"""
        try:
            self.search_engine = search_engine
            self.openai_client = OpenAI(api_key=openai_api_key)
            
            # 시스템 프롬프트 정의
            # qa_system.py의 system_prompt 수정
            self.system_prompt = """의사 프로필 정보를 기반으로 사용자의 질문에 답변해주세요.

            답변 형식:
            1. 첫 문단에서는 추천하는 교수님들을 소속과 함께 간단히 소개해주세요.

            2. 각 교수님별로 별도의 문단을 만들어 상세 설명을 해주세요:
            - 주요 치료 방식과 특징
            - 진료 스타일의 특징
            - 상담 스타일과 접근성
            
            3. 마지막에는 반드시 다음 형식으로 진료 키워드를 제시하세요:

            [진료 키워드]
            주요 진료분야(Main): (각 교수의 Main 컬럼 값)
            세부 전문분야(Specialty): (각 교수의 Specialty 컬럼 값)

            답변 스타일:
            - 각 문단은 명확히 구분해주세요
            - 교수별 설명은 3-4문장으로 구성해주세요
            - 공식적이고 전문적인 어투를 사용해주세요
            - 키워드는 반드시 굵은 글씨로 표시해주세요
            - 핵심 정보는 bullet point로 구분해주세요

            특정 질병이나 치료법에 대한 질문인 경우:
            1. 해당 질병/치료법에 대한 설명 (3-4문단)
            - 정의와 특징
            - 치료 방법과 과정
            - 장점과 주의사항
            - 예후와 관리방법

            2. [진료 키워드] 형식으로 마무리
            주요 진료분야(Main): (관련된 Main 값들)
            세부 전문분야(Specialty): (관련된 Specialty 값들)
            """

            logger.info("Successfully initialized QASystem")
            
        except Exception as e:
            logger.error(f"Error initializing QASystem: {e}")
            raise

    async def retrieve_and_answer(self, question: str) -> str:
        """질문에 대한 답변 생성"""
        try:
            search_results = await self.search_engine.search(
                question, 
                top_k=3
            )
            
            if not search_results:
                logger.warning("No search results found")
                return "죄송합니다. 해당 질문에 대한 관련 정보를 찾을 수 없습니다."

            # Prompt 구성
            prompt = f"""다음과 같은 질문을 받았습니다: '{question}'

검색 결과에서 찾은 관련 정보입니다:

"""
            # 검색 결과 포맷팅
            for idx, result in enumerate(search_results, 1):
                prompt += f"""[의사 정보 {idx}]
• 이름: {result.get('doctor_name')}
• 소속: {result.get('hospital')} {result.get('department')}
• 주요진료: {result.get('main_focus')}
• 전문분야: {result.get('specialty')}
• 진료 스타일: {result.get('treatment_style')}
• 특징: {result.get('uniqueness')}
• 환자 평가: {result.get('patient_evaluation')}
• 상담 스타일: {result.get('consultation_style')}

"""

            prompt += """위 정보를 바탕으로 상세한 답변을 제공해주세요.

특정 교수에 대한 질문이라면:
1. 진료 스타일, 특징, 환자 평가, 상담 방식
2. 전문성과 경력
3. 진료 키워드 (Main, Specialty)

질병, 수술, 치료법에 대한 질문이라면:
1. 상세한 설명 (3-4문단)
   - 정의와 특징
   - 치료 방법과 과정
   - 장점과 주의사항
   - 예후와 관리방법
2. 진료 키워드 (Main, Specialty)"""

            # GPT에 질문 전송
            try:
                # qa_system.py의 retrieve_and_answer 메서드 내
                response = await asyncio.to_thread(
                    self.openai_client.chat.completions.create,
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1500,
                    presence_penalty=0.6,  # 다양한 내용을 포함하도록
                    frequency_penalty=0.3  # 반복을 줄이도록
                )

                return response.choices[0].message.content
                
            except Exception as e:
                logger.error(f"Error generating GPT response: {e}")
                return f"죄송합니다. 답변 생성 중 오류가 발생했습니다: {str(e)}"
            
        except Exception as e:
            logger.error(f"Error in retrieve_and_answer: {e}")
            return f"죄송합니다. 답변 생성 중 오류가 발생했습니다: {str(e)}"