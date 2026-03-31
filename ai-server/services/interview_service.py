import os
import json
import re
import urllib.request
from openai import OpenAI
from schemas.interview_schema import ConversationTurn, FeedbackResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o")

# 면접관 시스템 프롬프트
INTERVIEWER_SYSTEM_PROMPT = """당신은 10년 경력의 전문 기술 면접관입니다.
주어진 이력서, 자기소개서, 채용공고를 바탕으로 맞춤형 면접 질문을 합니다.

규칙:
- 한 번에 하나의 질문만 합니다
- 이전 답변이 모호하거나 구체성이 부족하면 꼬리 질문을 합니다
- 친절하지만 날카롭고 핵심을 파고드는 어조로 질문합니다
- 지원자의 실제 경험과 문제 해결 능력을 파악하는 질문을 합니다
- 반드시 JSON 형식으로만 응답합니다: {"question": "질문 내용", "questionType": "INITIAL 또는 FOLLOWUP"}"""

# 피드백 시스템 프롬프트
FEEDBACK_SYSTEM_PROMPT = """당신은 전문 면접 코치입니다.
면접 대화 기록을 분석하여 상세한 피드백을 제공합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "logicScore": 0~100 정수,
  "relevanceScore": 0~100 정수,
  "specificityScore": 0~100 정수,
  "overallScore": 0~100 정수,
  "weakPoints": "부족한 점 설명",
  "improvements": "개선 방향 설명",
  "recommendedAnswer": "추천 답변 예시"
}"""


def generate_question(
    resume: str,
    cover_letter: str,
    job_description: str,
    history: list[ConversationTurn],
) -> dict:
    """AI 면접관이 다음 질문 생성"""

    # 대화 기록을 메시지 형식으로 변환
    messages = [{"role": "system", "content": INTERVIEWER_SYSTEM_PROMPT}]

    # 면접 컨텍스트 추가
    context = f"""[이력서]\n{resume}\n\n[자기소개서]\n{cover_letter}\n\n[채용공고]\n{job_description}"""
    messages.append({"role": "user", "content": context})

    # 이전 대화 기록 추가
    for turn in history:
        messages.append({"role": "assistant", "content": json.dumps({"question": turn.question, "questionType": "INITIAL"}, ensure_ascii=False)})
        messages.append({"role": "user", "content": f"답변: {turn.answer}"})

    messages.append({"role": "user", "content": "다음 질문을 해주세요."})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


def generate_batch_questions(position_title: str, resume_summary: str, job_description: str, question_count: int) -> list:
    """Java 백엔드용: 면접 질문 N개 한 번에 생성"""
    prompt = f"""[직무] {position_title}
[이력서 요약] {resume_summary}
[채용공고] {job_description}

위 정보를 바탕으로 실전 면접 질문 {question_count}개를 생성해주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{{
  "questions": [
    {{"sequenceNumber": 1, "questionText": "질문 내용"}},
    ...
  ]
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 10년 경력의 전문 기술 면접관입니다. 지원자의 역량을 정확히 평가할 수 있는 날카로운 면접 질문을 생성합니다. 반드시 JSON 형식으로만 응답합니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content).get("questions", [])


def analyze_answer(question_text: str, answer_text: str, job_description: str) -> dict:
    """Java 백엔드용: 단일 답변 분석 및 점수 반환"""
    prompt = f"""[질문] {question_text}
[답변] {answer_text}
[채용공고] {job_description}

위 면접 답변을 분석하여 아래 JSON 형식으로만 응답하세요:
{{
  "relevanceScore": 0~100,
  "logicScore": 0~100,
  "specificityScore": 0~100,
  "overallScore": 0~100,
  "feedbackSummary": "답변에 대한 구체적인 피드백"
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 전문 면접 코치입니다. 면접 답변을 객관적으로 평가하고 구체적인 피드백을 제공합니다. 반드시 JSON 형식으로만 응답합니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def generate_report_summary(session_title: str, position_title: str, answer_feedback: list) -> dict:
    """Java 백엔드용: 면접 세션 전체 리포트 요약 생성"""

    qa_sections = []
    for i, f in enumerate(answer_feedback, 1):
        qa_sections.append(
            f"[Q{i}] {f.get('questionText', '(질문 없음)')}\n"
            f"[지원자 답변] {f.get('answerText', '(답변 없음)')}\n"
            f"[점수] 종합 {f.get('overallScore', 0)}점 "
            f"(관련성 {f.get('relevanceScore', 0)} / 논리성 {f.get('logicScore', 0)} / 구체성 {f.get('specificityScore', 0)})\n"
            f"[AI 피드백] {f.get('feedbackSummary', '')}"
        )
    qa_text = "\n\n".join(qa_sections)

    # 점수가 가장 낮은 질문 번호 파악 (모범 답안 대상)
    if answer_feedback:
        worst_idx = min(range(len(answer_feedback)), key=lambda i: answer_feedback[i].get('overallScore', 100))
        worst_q = answer_feedback[worst_idx].get('questionText', '')
    else:
        worst_q = ''

    prompt = f"""면접 세션: {session_title} ({position_title})

아래는 지원자의 질문별 답변과 AI 평가입니다:

{qa_text}

위 면접 결과를 종합하여 아래 JSON 형식으로만 응답하세요:
{{
  "weakPoints": "전반적으로 부족했던 점을 2~3문장으로 구체적으로 설명 (어떤 질문에서 어떤 점이 부족했는지 명시)",
  "improvements": "구체적인 개선 방향을 2~3문장으로 설명 (STAR 기법, 수치 활용 등 실천 가능한 조언 포함)",
  "recommendedAnswer": "다음 질문에 대해 합격 수준의 모범 답변을 작성하라: [{worst_q}]. STAR 기법(상황→과제→행동→결과)을 사용하고, 구체적인 기술명·수치·성과를 반드시 포함하여 실제 면접에서 바로 활용할 수 있는 수준으로 상세하게 작성할 것. 최소 5문장 이상."
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 10년 경력의 전문 면접 코치입니다. 지원자의 실제 답변을 분석하고, 합격 수준의 구체적이고 상세한 모범 답변을 제공합니다. 반드시 JSON 형식으로만 응답합니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def parse_job_posting(url: str = None, content: str = None) -> dict:
    """채용공고 URL 또는 텍스트에서 회사명·직무·내용 추출"""
    if url:
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw_html = resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            raise RuntimeError(f"URL 접근 실패: {e}")
        html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()[:6000]
    elif content:
        text = content.strip()[:6000]
    else:
        raise RuntimeError("url 또는 content 중 하나는 필수입니다.")

    prompt = f"""아래는 채용공고 내용입니다.
회사명, 직무명, 주요 업무/자격요건 내용을 추출하세요.

[채용공고 내용]
{text}

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "companyName": "회사명 (없으면 빈 문자열)",
  "positionTitle": "직무명 (없으면 빈 문자열)",
  "description": "주요 업무와 자격요건 요약 (3~5문장)"
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 채용공고에서 핵심 정보를 추출하는 전문가입니다. 반드시 JSON 형식으로만 응답합니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def generate_feedback(history: list[ConversationTurn]) -> FeedbackResponse:
    """면접 전체 대화를 분석하여 피드백 생성"""

    conversation_text = "\n".join(
        [f"Q: {turn.question}\nA: {turn.answer}" for turn in history]
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": FEEDBACK_SYSTEM_PROMPT},
            {"role": "user", "content": f"다음 면접 대화를 분석해주세요:\n\n{conversation_text}"},
        ],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return FeedbackResponse(**data)
