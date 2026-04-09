import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o")

REVIEW_SYSTEM_PROMPT = """당신은 10년 경력의 IT 채용 전문가이자 이력서/자기소개서 첨삭 전문가입니다.
지원자의 문서를 분석하고 구체적이고 실질적인 피드백을 제공합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "overall": "전반적인 평가를 2~3문장으로 작성 (현재 수준과 인상 위주)",
  "strengths": ["강점1 (구체적으로)", "강점2 (구체적으로)", "강점3 (구체적으로)"],
  "improvements": ["개선점1: 구체적인 이유와 방향 설명", "개선점2: 구체적인 이유와 방향 설명", "개선점3: 구체적인 이유와 방향 설명"],
  "revisedSuggestions": ["수정 전: '...' → 수정 후: '...' (이유: ...)", "수정 전: '...' → 수정 후: '...' (이유: ...)"]
}"""


def review_document(content: str, document_type: str) -> dict:
    doc_label = "이력서" if document_type == "resume" else "자기소개서"

    prompt = f"""아래 {doc_label}를 분석하여 IT 취업 준비생에게 도움이 되는 전문적인 첨삭 피드백을 제공해주세요.

[{doc_label} 내용]
{content[:5000]}

강점, 개선점, 구체적인 수정 전/후 예시를 포함한 피드백을 JSON 형식으로 작성해주세요.
수정 제안은 실제 문장 수준으로 구체적으로 작성해주세요."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
