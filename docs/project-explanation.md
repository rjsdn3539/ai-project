# AI 모의 면접 및 학습 플랫폼 — 기능 설명서

> 이 문서는 프로젝트의 핵심 기능과 그 기능을 구현한 코드를 처음 코드를 배우는 사람도 이해할 수 있도록 설명합니다.

---

## 목차

1. [기술 스택 및 아키텍처](#1-기술-스택-및-아키텍처)
2. [핵심 서비스 개요](#2-핵심-서비스-개요)
3. [주요 기능 구현](#3-주요-기능-구현)
   - [AI 면접 프로세스](#31-ai-면접-프로세스)
   - [학습 문제 생성 및 SSE 스트리밍](#32-학습-문제-생성-및-sse-스트리밍)
   - [사용자 대시보드 (통계 시각화)](#33-사용자-대시보드-통계-시각화)
   - [도서 서비스 (알라딘 연동)](#34-도서-서비스-알라딘-연동)
   - [구독 플랜 서비스](#35-구독-플랜-서비스)
   - [채용공고 크롤링](#36-채용공고-크롤링)
4. [기술적 문제 해결](#4-기술적-문제-해결)
   - [AI 질문 생성 최적화 (중복 방지)](#41-ai-질문-생성-최적화-중복-방지)
   - [PDF/DOCX 파일 파싱](#42-pdfdocx-파일-파싱)
   - [통계 데이터 무결성 (미완료 세션 0점 문제)](#43-통계-데이터-무결성-미완료-세션-0점-문제)
   - [외부 API 활용 전략 (알라딘 API 전환)](#44-외부-api-활용-전략-알라딘-api-전환)
5. [프로젝트 성과 및 회고](#5-프로젝트-성과-및-회고)
6. [마무리 — 팀원 소감](#6-마무리--팀원-소감)

---

## 1. 기술 스택 및 아키텍처

### 사용한 기술들

| 분류 | 기술 | 역할 |
|------|------|------|
| **백엔드** | Java 21 + Spring Boot | API 서버 (회원, 면접, 도서, 결제 등) |
| **백엔드** | Spring Security + JWT | 로그인 인증 및 권한 관리 |
| **백엔드** | JPA + MariaDB | 데이터베이스 연동 |
| **AI 서버** | Python + FastAPI | AI 기능 전담 서버 |
| **AI** | OpenAI ChatGPT API | 면접 질문 생성, 피드백, 문제 생성 |
| **AI** | Whisper (STT) | 음성을 텍스트로 변환 |
| **프론트엔드** | Vite + React | 사용자 화면 |
| **프론트엔드** | Zustand | 전역 상태 관리 (로그인 상태 등) |
| **프론트엔드** | Recharts | 통계 차트 그리기 |
| **결제** | PortOne + KakaoPay | 구독 결제 |
| **배포** | AWS EC2 | 서버 배포 |

### 시스템 구조 (서버가 3개!)

```
사용자 브라우저 (React)
       ↕ HTTP 요청
Java 백엔드 서버 (Spring Boot) ← 회원/면접/도서/결제 로직
       ↕ HTTP 요청 (AI 기능이 필요할 때)
Python AI 서버 (FastAPI) ← GPT API 호출, 문제 생성, 크롤링
```

> 핵심 포인트: Java와 Python 서버를 분리한 이유는, AI 관련 라이브러리(OpenAI SDK 등)가 Python에서 훨씬 편리하기 때문입니다. Java는 비즈니스 로직(회원, 결제 등)을 담당하고, Python은 AI 기능만 전담합니다.

---

## 2. 핵심 서비스 개요

이 플랫폼이 제공하는 4가지 핵심 서비스:

| 서비스 | 설명 |
|--------|------|
| **AI 면접** | 이력서·자기소개서·채용공고를 분석해서 맞춤형 면접 질문 생성 및 피드백 |
| **학습 문제 생성** | 과목·난이도를 선택하면 AI가 문제를 실시간으로 생성해서 보내줌 |
| **대시보드 통계** | 면접 점수, 학습 진도를 그래프로 시각화 |
| **도서 스토어** | 알라딘 API 연동 + 구독 결제로 IT 도서 제공 |

---

## 3. 주요 기능 구현

### 3.1 AI 면접 프로세스

#### 전체 흐름

```
1. 사용자가 이력서 + 자기소개서 + 채용공고 선택
2. 백엔드가 AI 서버에 "질문 N개 만들어줘" 요청
3. AI 서버가 GPT에게 질문 생성 요청 → 결과 반환
4. 사용자가 질문에 답변 입력
5. 백엔드가 AI 서버에 "이 답변 분석해줘" 요청
6. AI 서버가 GPT에게 점수·피드백 생성 요청 → 결과 반환
7. 면접 종료 후 최종 리포트 생성
```

#### [Python - AI 서버] 면접 질문 생성 코드

파일 위치: `ai-server/services/interview_service.py`

```python
# OpenAI 클라이언트 초기화
# os.getenv()는 환경변수에서 값을 읽어옵니다 (API 키를 코드에 직접 쓰면 보안 위험!)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o")  # 기본값은 gpt-4o

# AI 면접관에게 내릴 "역할 지시문" (System Prompt)
INTERVIEWER_SYSTEM_PROMPT = """당신은 10년 경력의 전문 기술 면접관입니다.
주어진 이력서, 자기소개서, 채용공고를 바탕으로 맞춤형 면접 질문을 합니다.

규칙:
- 한 번에 하나의 질문만 합니다
- 이전 답변이 모호하거나 구체성이 부족하면 꼬리 질문을 합니다
- 반드시 JSON 형식으로만 응답합니다: {"question": "질문 내용", "questionType": "INITIAL 또는 FOLLOWUP"}"""
```

> **System Prompt란?** GPT에게 "너는 이런 역할이야"라고 미리 알려주는 지시문입니다. 일반 채팅과 달리 AI의 성격과 행동 방식을 고정시킬 수 있습니다.

```python
def generate_question(resume, cover_letter, job_description, history):
    """AI 면접관이 다음 질문을 생성하는 함수"""

    # GPT에게 보낼 메시지 목록 (대화 형식으로 전달)
    messages = [{"role": "system", "content": INTERVIEWER_SYSTEM_PROMPT}]

    # 이력서, 자소서, 채용공고를 하나의 텍스트로 묶어서 전달
    context = f"[이력서]\n{resume}\n\n[자기소개서]\n{cover_letter}\n\n[채용공고]\n{job_description}"
    messages.append({"role": "user", "content": context})

    # 이전 대화 기록을 순서대로 추가 (꼬리 질문을 위해 필요)
    for turn in history:
        messages.append({"role": "assistant", "content": turn.question})
        messages.append({"role": "user", "content": f"답변: {turn.answer}"})

    messages.append({"role": "user", "content": "다음 질문을 해주세요."})

    # GPT API 호출
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        response_format={"type": "json_object"},  # JSON만 반환하도록 강제
    )

    # 응답에서 JSON 파싱
    return json.loads(response.choices[0].message.content)
```

> **왜 대화 기록을 전부 보낼까요?** GPT는 기억이 없습니다. 매 요청마다 이전 대화 내용을 함께 보내야 "아, 이 사람이 아까 이 질문에 저렇게 답했구나"를 알 수 있습니다.

#### [Python - AI 서버] 답변 분석 및 점수 매기기

```python
def analyze_answer(question_text, answer_text, job_description):
    """사용자 답변을 분석하고 점수를 매기는 함수"""

    prompt = f"""[질문] {question_text}
[답변] {answer_text}
[채용공고] {job_description}

위 면접 답변을 분석하여 아래 JSON 형식으로만 응답하세요:
{{
  "relevanceScore": 0~100,   // 질문과 관련성 점수
  "logicScore": 0~100,       // 논리성 점수
  "specificityScore": 0~100, // 구체성 점수
  "overallScore": 0~100,     // 종합 점수
  "feedbackSummary": "답변에 대한 구체적인 피드백"
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 전문 면접 코치입니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

#### [Java - 백엔드] 면접 세션 컨트롤러

파일 위치: `backend/.../interview/controller/InterviewSessionController.java`

```java
// @RestController: 이 클래스는 HTTP 요청을 받는 API 역할을 합니다
// @RequestMapping: 이 컨트롤러의 모든 URL은 /api/v1/interviews/sessions로 시작합니다
@RestController
@RequestMapping("/api/v1/interviews/sessions")
public class InterviewSessionController {

    // @GetMapping: GET 요청 → 면접 목록 조회
    @GetMapping
    public ApiResponse<List<InterviewSessionResponse>> getSessions(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        // authenticatedUser.userId()로 현재 로그인한 사람의 ID를 가져옵니다
        return ApiResponse.success(interviewSessionService.getSessions(authenticatedUser.userId()));
    }

    // @PostMapping: POST 요청 → 면접 시작
    @PostMapping
    public ApiResponse<InterviewSessionResponse> startSession(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody StartInterviewSessionRequest request) {
        return ApiResponse.success(interviewSessionService.startSession(authenticatedUser.userId(), request));
    }

    // 면접 답변 저장 (/{sessionId}/answers 경로)
    @PostMapping("/{sessionId}/answers")
    public ApiResponse<InterviewAnswerResponse> saveAnswer(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long sessionId,       // URL의 {sessionId} 값을 받음
            @Valid @RequestBody SaveInterviewAnswerRequest request) {
        return ApiResponse.success(interviewSessionService.saveAnswer(
            authenticatedUser.userId(), sessionId, request));
    }

    // 최종 리포트 조회
    @GetMapping("/{sessionId}/report")
    public ApiResponse<InterviewResultReportResponse> getResultReport(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long sessionId) {
        return ApiResponse.success(interviewSessionService.getResultReport(
            authenticatedUser.userId(), sessionId));
    }
}
```

> **@AuthenticationPrincipal이란?** Spring Security가 JWT 토큰을 분석해서 "이 요청은 userId=5인 사람이 보낸 것"이라고 자동으로 알려주는 어노테이션입니다. 매번 토큰을 직접 파싱할 필요가 없습니다.

#### [React - 프론트엔드] 면접 API 호출

파일 위치: `frontend/src/api/interview.js`

```javascript
import api from './axios'  // 공통 axios 인스턴스 (baseURL, 토큰 자동 첨부)

// 면접 세션 시작
export const startSession = (body) =>
  api.post('/api/v1/interviews/sessions', body)

// 답변 제출
export const submitAnswer = (id, body) =>
  api.post(`/api/v1/interviews/sessions/${id}/answers`, body)

// 면접 종료
export const endSession = (id) =>
  api.post(`/api/v1/interviews/sessions/${id}/end`)

// 결과 리포트 조회
export const getFeedback = (id) =>
  api.get(`/api/v1/interviews/sessions/${id}/report`)
```

> **api.post/get이란?** Axios 라이브러리를 이용해 백엔드 서버에 HTTP 요청을 보내는 함수입니다. 백엔드와 프론트엔드는 이렇게 API로 데이터를 주고받습니다.

---

### 3.2 학습 문제 생성 및 SSE 스트리밍

#### SSE(Server-Sent Events)란?

일반적인 HTTP 요청은 "요청 → 응답 → 연결 종료" 방식입니다.  
SSE는 서버가 데이터를 **조금씩 나눠서 실시간으로 계속** 보내줄 수 있는 방식입니다.

```
일반 방식: 요청 → [5초 기다림] → 5문제 한꺼번에 받음
SSE 방식:  요청 → 1문제 완성되면 즉시 전달 → 2번째 완성되면 즉시 전달 → ...
```

문제가 AI로 생성되는 데 시간이 걸리므로, 기다리는 시간 없이 생성되는 즉시 화면에 표시할 수 있습니다.

#### [Python - AI 서버] SSE 스트리밍 엔드포인트

파일 위치: `ai-server/routers/learning.py`

```python
from fastapi.responses import StreamingResponse

@router.post("/generate/stream")
async def generate_problems_stream(req: GenerateRequest):
    """학습 문제를 SSE로 스트리밍하는 엔드포인트"""

    # async def: 비동기 함수 (여러 작업을 동시에 처리 가능)
    async def event_stream():
        try:
            # generate_problems_stream()이 문제를 하나씩 yield할 때마다 실행됨
            async for problem in learning_service.generate_problems_stream(
                subject=req.subject,
                difficulty=req.difficulty,
                count=req.count,
            ):
                # "data: {JSON}\n\n" 형식이 SSE 규격입니다
                yield f"data: {problem.model_dump_json()}\n\n"
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

        # 모든 문제가 끝나면 [DONE] 신호 전송
        yield "data: [DONE]\n\n"

    # media_type="text/event-stream": SSE 전용 Content-Type
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

#### [Python - AI 서버] 문제를 병렬로 생성하기

파일 위치: `ai-server/services/learning_service.py`

```python
import asyncio  # 파이썬 비동기 처리 라이브러리

async def generate_problems_stream(subject, difficulty, count):
    """N개 문제를 동시에(병렬로) 생성하고 완료되는 순서대로 yield"""

    import random
    topics = SUBJECT_TOPICS.get(subject, [])

    # 소주제를 랜덤하게 섞어서 문제마다 다른 주제 배정 → 중복 방지
    if topics:
        shuffled = random.sample(topics, min(len(topics), count))
        while len(shuffled) < count:
            extra = random.sample(topics, min(len(topics), count - len(shuffled)))
            shuffled += extra
        assigned_topics = shuffled[:count]
    else:
        assigned_topics = [""] * count

    # count개의 문제 생성 작업을 동시에 시작 (병렬 처리)
    tasks = [
        asyncio.ensure_future(
            _generate_one_problem_async(subject, difficulty_kor, system_prompt, assigned_topics[i])
        )
        for i in range(count)
    ]

    # as_completed: 완료된 작업부터 순서대로 결과를 가져옴
    for coro in asyncio.as_completed(tasks):
        try:
            problem = await coro
            if problem:
                yield problem  # 문제 하나가 완성될 때마다 즉시 전달
        except Exception:
            pass  # 하나가 실패해도 나머지는 계속 진행
```

> **병렬 처리의 장점:** 5문제를 순서대로 만들면 5배의 시간이 걸립니다. 동시에 만들면 1문제 생성 시간과 비슷하게 줄어듭니다.

#### 과목별 학습 영역 세분화

```python
# 파이썬 과목의 소주제 목록 (각 문제가 다른 주제에서 출제되도록)
SUBJECT_TOPICS = {
    "파이썬": [
        "기본 자료형(int/float/str/bool)", "리스트/튜플", "딕셔너리/셋",
        "조건문/반복문", "함수(정의/인자/반환)", "클래스/OOP",
        "예외처리", "파일입출력", "표준라이브러리",
        "데코레이터/제너레이터", "comprehension", "lambda/map/filter"
    ],
    "자바스크립트": [...],
    "C++": [...],
    # ... (영어, 일본어, 데이터베이스, 자바, 스프링, 국사 등)
}
```

> 같은 파이썬이라도 "리스트"만 계속 나오지 않도록, 랜덤하게 소주제를 배정하여 학습의 다양성을 보장합니다.

---

### 3.3 사용자 대시보드 (통계 시각화)

#### Recharts로 점수 그래프 그리기

파일 위치: `frontend/src/pages/DashboardPage.jsx`

```jsx
// Recharts: React에서 차트를 쉽게 그릴 수 있는 라이브러리
import {
  ResponsiveContainer, Area, AreaChart, XAxis, YAxis,
  Tooltip, ReferenceLine
} from 'recharts'

// 목표 점수 기준선 (85점)
const GOAL_SCORE = 85

// 구독 등급별 색상
const TIER_COLOR = {
  FREE: '#b3a99e',
  STANDARD: '#7c6af0',
  PRO: '#9b5de5',
  PREMIUM: 'var(--warning)'
}

// 점수에 따른 상위 몇 % 계산
function getPercentile(score) {
  if (!score) return null
  if (score >= 90) return 5   // 90점 이상 → 상위 5%
  if (score >= 80) return 20
  if (score >= 70) return 35
  if (score >= 60) return 52
  return 70
}
```

```jsx
// 실제 차트 렌더링 (면접 점수 추이 그래프)
<ResponsiveContainer width="100%" height={220}>
  <AreaChart data={scoreData}>
    {/* X축: 날짜 */}
    <XAxis dataKey="date" />
    {/* Y축: 0~100 점수 */}
    <YAxis domain={[0, 100]} />
    {/* 마우스 올리면 보이는 툴팁 */}
    <Tooltip content={<CustomTooltip />} />
    {/* 목표 점수 기준선 (빨간 점선) */}
    <ReferenceLine y={GOAL_SCORE} stroke="#ef4444" strokeDasharray="4 4" />
    {/* 점수 영역 그래프 (보라색) */}
    <Area type="monotone" dataKey="score" stroke="#7c6af0" fill="rgba(124,106,240,0.1)" />
  </AreaChart>
</ResponsiveContainer>
```

> **Recharts 사용법 요약:** 데이터 배열(`data`)을 넘겨주면 알아서 그래프를 그려줍니다. `XAxis`/`YAxis`로 축을 설정하고, `Area`/`Bar`/`Line` 등으로 그래프 종류를 선택합니다.

#### 코칭 피드백 위젯

```jsx
// 가장 최근 면접 결과에서 약점과 개선방향을 뽑아 위젯으로 표시
function buildCoachingItems(feedback) {
  const items = []

  if (feedback?.weakPoints) {
    items.push({
      icon: '⚠️',
      title: '부족한 부분',
      desc: feedback.weakPoints,
    })
  }

  if (feedback?.improvements) {
    items.push({
      icon: '💡',
      title: '개선 방향',
      desc: feedback.improvements,
    })
  }

  return items
}
```

---

### 3.4 도서 서비스 (알라딘 연동)

#### 알라딘 API → 로컬 DB 저장 전략

PPT에서 언급된 문제: 알라딘 "리스트 API"는 데이터가 부족하고 느림 → **검색 API**로 전환 + 결과를 로컬 DB에 저장

```
[이전 방식] 사용자 요청 → 알라딘 리스트 API 호출 → 느린 응답, 데이터 부족
[개선 방식] 관리자가 검색 API로 데이터 수집 → 로컬 DB 저장
           사용자 요청 → 로컬 DB 조회 → 빠른 응답
```

파일 위치: `backend/.../book/service/BookSyncService.java`

```java
@Service
@RequiredArgsConstructor  // final 필드의 생성자를 자동으로 만들어주는 Lombok 어노테이션
public class BookSyncService {

    private final AladinBookService aladinBookService;  // 알라딘 API 호출 담당
    private final BookRepository bookRepository;         // DB 저장 담당

    @Transactional  // 중간에 오류 나도 전체 롤백 보장
    public SyncAladinBooksResponse syncAladinBooks(SyncAladinBooksRequest request) {

        // 1. 알라딘 검색 API 호출
        AladinItemListResponse response = aladinBookService.searchBooks(
            request.query().trim(),   // 검색어
            "Book",                   // 검색 대상
            "27660",                  // IT/컴퓨터 카테고리 ID
            10,                       // 최대 10개
            1                         // 1페이지부터
        );

        int createdCount = 0;  // 새로 추가된 책 수
        int updatedCount = 0;  // 업데이트된 책 수

        // 2. 검색 결과를 하나씩 DB에 저장
        for (AladinBookItemResponse item : response.items()) {

            // ISBN으로 이미 DB에 있는 책인지 확인
            Book book = findExistingBook(item)
                .orElseGet(() -> Book.builder()  // 없으면 새로 만들기
                    .title(item.title())
                    .author(item.author())
                    .build());

            boolean isNew = book.getId() == null;  // 새 책인지 확인

            // 알라딘 데이터 적용 (제목, 가격, 커버 이미지, 설명 등)
            book.applyAladinData(
                item.itemId(), item.isbn(), item.isbn13(),
                item.title(), item.author(), item.publisher(),
                item.description(), item.cover(),
                item.priceStandard(), item.priceSales(),
                /* stock */ 10, "ON_SALE", "ALADIN",
                LocalDateTime.now()
            );
            bookRepository.save(book);

            if (isNew) createdCount++;
            else updatedCount++;
        }

        return new SyncAladinBooksResponse(
            response.items().size(), createdCount + updatedCount,
            createdCount, updatedCount
        );
    }

    // 기존 책 찾기: itemId → isbn13 순서로 확인
    private Optional<Book> findExistingBook(AladinBookItemResponse item) {
        if (item.itemId() != null) {
            Optional<Book> byItemId = bookRepository.findByItemId(item.itemId());
            if (byItemId.isPresent()) return byItemId;
        }
        if (item.isbn13() != null && !item.isbn13().isBlank()) {
            return bookRepository.findByIsbn13(item.isbn13());
        }
        return Optional.empty();
    }
}
```

> **@Transactional이란?** DB에 여러 개를 저장하다가 중간에 오류가 나면 지금까지 저장한 것을 전부 취소(롤백)해줍니다. 데이터 일관성을 보장하기 위해 사용합니다.

---

### 3.5 구독 플랜 서비스

#### 구독 등급별 기능 제한

파일 위치: `backend/.../domain/subscription/SubscriptionService.java`

```java
@Service
public class SubscriptionService {

    public SubscriptionStatusResponse getMyStatus(Long userId) {
        User user = getUser(userId);
        SubscriptionTier tier = user.getEffectiveTier();  // FREE / STANDARD / PRO / PREMIUM

        // 이번 달 시작 시점 계산
        LocalDateTime monthStart = LocalDateTime.now()
            .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        // 이번 달에 사용한 면접 횟수 조회
        long usedInterviews = interviewSessionRepository
            .countByUserIdAndStartedAtAfter(userId, monthStart);

        // 등급별 면접 가능 횟수 (SubscriptionPolicy에 정의)
        int interviewLimit = SubscriptionPolicy.monthlyInterviewLimit(tier);

        // 남은 횟수 계산 (UNLIMITED면 무제한)
        int remaining = interviewLimit == SubscriptionPolicy.UNLIMITED
            ? SubscriptionPolicy.UNLIMITED
            : (int) Math.max(0, interviewLimit - usedInterviews);

        return new SubscriptionStatusResponse(
            tier,
            user.getSubscriptionExpiresAt(),   // 만료일
            (int) usedInterviews,
            interviewLimit,
            remaining,
            SubscriptionPolicy.dailyLearningLimit(tier),      // 하루 학습 한도
            SubscriptionPolicy.profileDocLimit(tier),          // 저장 가능한 문서 수
            SubscriptionPolicy.maxQuestionCount(tier),         // 면접 최대 질문 수
            SubscriptionPolicy.isFeedbackScoreVisible(tier),   // 점수 공개 여부
            SubscriptionPolicy.bookDiscountRate(tier),         // 도서 할인율
            user.getPendingDowngradeTier()
        );
    }

    // 구독 플랜 변경 (결제 완료 후 호출됨)
    @Transactional
    public void changeSubscription(Long userId, SubscriptionTier tier, int durationMonths) {
        User user = getUser(userId);
        LocalDateTime expiresAt = tier == SubscriptionTier.FREE
            ? null  // 무료는 만료일 없음
            : LocalDateTime.now().plusMonths(durationMonths);  // 유료는 N개월 후 만료
        user.changeSubscription(tier, expiresAt);
    }
}
```

> **SubscriptionPolicy란?** 각 등급(FREE, STANDARD, PRO, PREMIUM)이 사용할 수 있는 기능의 한도를 중앙에서 관리하는 클래스입니다. 정책이 바뀌면 이 클래스 하나만 수정하면 됩니다.

---

### 3.6 채용공고 크롤링

URL에서 채용공고 정보를 자동으로 가져와서 AI가 분석해주는 기능입니다.

파일 위치: `ai-server/services/interview_service.py`

```python
import urllib.request  # 파이썬 기본 내장 HTTP 요청 라이브러리
import re              # 정규표현식 (텍스트 패턴 찾기/제거)

def parse_job_posting(url=None, content=None):
    """채용공고 URL 또는 텍스트에서 회사명·직무·내용 추출"""

    if url:
        # ── Step 1: URL에서 HTML 가져오기 ──
        req = urllib.request.Request(url, headers={
            # User-Agent: 사람이 쓰는 브라우저처럼 보이게 위장 (봇 차단 우회)
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_html = resp.read().decode("utf-8", errors="ignore")

        # ── Step 2: HTML 정제 ──
        # <script>...</script> 와 <style>...</style> 태그 제거
        html = re.sub(
            r"<(script|style)[^>]*>.*?</\1>",
            "",
            raw_html,
            flags=re.DOTALL | re.IGNORECASE  # 줄바꿈 포함, 대소문자 무시
        )
        # 나머지 HTML 태그 제거 (<div>, <p>, <span> 등)
        text = re.sub(r"<[^>]+>", " ", html)
        # 연속된 공백을 하나로 줄이고, 앞뒤 공백 제거, 최대 6000자만 사용
        text = re.sub(r"\s+", " ", text).strip()[:6000]

    elif content:
        text = content.strip()[:6000]
    else:
        raise RuntimeError("url 또는 content 중 하나는 필수입니다.")

    # ── Step 3: GPT로 구조화된 정보 추출 ──
    prompt = f"""아래는 채용공고 내용입니다.
회사명, 직무명, 주요 업무/자격요건 내용을 추출하세요.

[채용공고 내용]
{text}

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "companyName": "회사명",
  "positionTitle": "직무명",
  "description": "주요 업무와 자격요건 요약 (3~5문장)"
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 채용공고에서 핵심 정보를 추출하는 전문가입니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

> **크롤링 전체 흐름:**
> 1. URL로 접속해서 HTML 파일 전체를 받아옴
> 2. `<script>`, `<style>` 등 불필요한 태그 제거
> 3. 남은 텍스트를 GPT에게 전달 → 회사명·직무명·내용을 구조화

> **왜 User-Agent를 바꾸나요?** 많은 웹사이트가 자동 프로그램(봇)의 접근을 차단합니다. 브라우저처럼 보이도록 헤더를 설정하면 일반적인 차단을 피할 수 있습니다.

---

## 4. 기술적 문제 해결

### 4.1 AI 질문 생성 최적화 (중복 방지)

**문제:** 처음에는 "이미 나온 질문과 겹치면 다시 만들어"라는 로직을 AI 생성 단계에서 걸었더니, AI가 질문 생성 자체를 포기해버리는 현상 발생.

**해결:** 중복 검사를 AI 생성 이후로 분리하고, 소주제 풀(pool)에서 무작위 추출·셔플 방식으로 자연스럽게 다양성 확보.

```python
# 개선된 방식: 소주제 목록을 미리 섞어서 각 문제에 배정
topics = SUBJECT_TOPICS.get(subject, [])
if topics:
    # random.sample: 중복 없이 랜덤하게 N개 선택
    shuffled = random.sample(topics, min(len(topics), count))
    # 문제 수가 소주제 수보다 많으면 추가로 샘플링
    while len(shuffled) < count:
        extra = random.sample(topics, min(len(topics), count - len(shuffled)))
        shuffled += extra
    assigned_topics = shuffled[:count]  # 각 문제에 소주제 1개씩 배정
```

> 이전: "중복이면 거부" → AI가 막힘  
> 이후: "소주제를 다르게 배정" → AI가 자연스럽게 다양한 문제 생성

---

### 4.2 PDF/DOCX 파일 파싱

**문제:** 이력서/자기소개서를 그냥 텍스트로 읽으면(`readAsText`) 한글이 깨지거나 내용이 누락됨.

**해결:** 파일 형식(PDF/DOCX)에 따라 전용 파싱 라이브러리를 사용하도록 분기 처리.

```
[이전 방식]
PDF 파일 → readAsText() → ??? 깨진 텍스트 → AI에게 잘못된 정보 전달

[개선 방식]
PDF 파일  → PDF 파서 → 정상 텍스트 추출 → AI에게 정확한 정보 전달
DOCX 파일 → DOCX 파서 → 정상 텍스트 추출 → AI에게 정확한 정보 전달
```

> **핵심:** 파일 타입을 먼저 확인하고, 각 타입에 맞는 라이브러리로 텍스트를 추출해야 합니다.

---

### 4.3 통계 데이터 무결성 (미완료 세션 0점 문제)

**문제:** 면접 도중에 나가거나 완료하지 않은 세션도 0점으로 통계에 잡혀서 평균 점수가 낮게 나오는 오류.

**해결:** 통계 쿼리/로직에서 `status = COMPLETED` 인 세션만 필터링.

```java
// 수정 전: 모든 세션의 점수를 평균냄 (미완료 세션도 포함 → 0점이 들어감)
List<InterviewSession> allSessions = repo.findByUserId(userId);

// 수정 후: 완료된 세션만 조회
List<InterviewSession> completedSessions = repo.findByUserIdAndStatus(
    userId,
    InterviewSessionStatus.COMPLETED  // COMPLETED 상태만 필터
);
```

```
예시:
- 세션1: COMPLETED, 점수 80점
- 세션2: ABANDONED (미완료), 점수 0점  ← 이것을 제외
- 세션3: COMPLETED, 점수 70점

수정 전 평균: (80 + 0 + 70) / 3 = 50점  ← 잘못된 값
수정 후 평균: (80 + 70) / 2 = 75점      ← 올바른 값
```

---

### 4.4 외부 API 활용 전략 (알라딘 API 전환)

**문제:** 알라딘 "리스트 API"는 카테고리 단위로 책을 가져오는데, 데이터가 적고 응답이 느림.

**해결:**

| 구분 | 이전 | 이후 |
|------|------|------|
| API 종류 | 리스트 API | 검색 API (키워드 검색) |
| 데이터 저장 | 매번 알라딘 API 호출 | 로컬 DB에 캐싱 |
| 응답 속도 | 느림 (외부 API 대기) | 빠름 (DB 직접 조회) |

```
[개선된 흐름]
관리자: "파이썬 책 검색해서 DB에 저장해줘" → BookSyncService 실행 → DB 저장
사용자: "도서 목록 보여줘" → DB 조회 → 빠른 응답 (알라딘 API 호출 X)
```

---

## 5. 프로젝트 성과 및 회고

### 성능 향상 결과

| 개선 항목 | 내용 |
|-----------|------|
| **실시간성 확보** | SSE 스트리밍으로 문제 생성 대기 시간을 체감상 크게 단축 |
| **AI 인터랙션 정밀화** | 이력서/채용공고 텍스트 추출 고도화 → 맞춤형 질문 생성 정확도 향상 |
| **시스템 효율성** | 알라딘 데이터 로컬 DB 캐싱 → API 호출 횟수 감소, 응답 속도 개선 |

### 보완점 — 초기 → 개선 과정

| 초기 문제 | 개선 결과 |
|-----------|-----------|
| 정해진 질문 세트만 반복 출제 | 소주제 풀 랜덤 배정으로 다양한 문제 생성 |
| AI 생성 중단 현상 (중복 검사 로직 충돌) | 중복 검사를 생성 이후로 분리해 끊김 없는 생성 구현 |
| 전체 데이터가 쌓일 때까지 대기 | SSE 스트리밍 도입으로 생성 즉시 사용자에게 전달 |

### 아쉬운 점

- **음성 인식(STT) 미완성:** Whisper로 사용자 말을 텍스트로 변환하는 기능을 계획했으나, 일정상 이번 프로젝트에서는 제외됨. (`ai-server/routers/stt.py` 파일은 존재하지만 미완성)
- **실시간 채용공고 연동 한계:** 잡코리아, 사람인 등 채용 API가 외부에 공개되지 않아, URL 크롤링 방식에 의존하게 됨.

---

## 6. 마무리 — 팀원 소감

### 김영준 (팀장)
> AI 기능은 모델을 호출하는 것 자체보다, **실패 상황까지 고려해 실제 서비스 안에 안정적으로 녹여내는 과정이 더 어렵고 중요하다는 것**을 배웠습니다. 인증, 구독, 결제, 관리자 기능까지 확장하면서 제품의 복잡도가 빠르게 커지는 것도 직접 체감할 수 있었습니다.

### 안창현
> AI API의 유연성과 확장성에 깊은 인상을 받았습니다. 웹 스크래핑, 임베딩, RAG, ChromaDB 등을 적용하며 AI가 다양한 분야로 확장될 수 있음을 체감했고, **새로운 기술을 단순히 사용하는 데 그치지 않고 구조를 이해하려 노력**하며 실제 서비스에 연결해본 시간이어서 더욱 의미 있었습니다.

### 이한나
> 처음에는 AI라는 도구의 화려함에 집중했지만, 프로젝트를 마친 지금은 **그 도구를 다루는 개발자의 섬세한 로직과 설계가 얼마나 중요한지** 실감합니다.

### 고건우
> 처음엔 기능을 완성하는 것이 목표였지만, 개발할수록 **"왜 이렇게 설계해야 하는가"를 고민하게 됐습니다**. 코드를 잘 짜는 것보다 좋은 질문을 던지는 개발자가 되고 싶다는 생각을 하게 된 프로젝트였습니다.

---

*문서 작성 기준일: 2026-04-06*
