import os
import json
import asyncio
from openai import OpenAI, AsyncOpenAI
from schemas.learning_schema import Problem, GradeResponse, PlacementProblem, HintResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("MODEL_NAME", "gpt-4o")
USE_MOCK = os.getenv("USE_MOCK", "false").lower() == "true"

MOCK_PROBLEMS = [
    Problem(type="MULTIPLE", question="다음 중 Python의 리스트 메서드가 아닌 것은?",
            choices=["append()", "extend()", "push()", "remove()"],
            answer="push()", explanation="Python 리스트는 push()가 없고 append()를 사용합니다."),
    Problem(type="SHORT", question="HTML에서 하이퍼링크를 만드는 태그는?",
            choices=None, answer="<a>", explanation="<a href='URL'>텍스트</a> 형태로 사용합니다."),
    Problem(type="MULTIPLE", question="다음 중 관계형 데이터베이스가 아닌 것은?",
            choices=["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
            answer="MongoDB", explanation="MongoDB는 NoSQL 문서형 데이터베이스입니다."),
    Problem(type="SHORT", question="HTTP 상태코드 404의 의미는?",
            choices=None, answer="Not Found", explanation="요청한 리소스를 서버에서 찾을 수 없음을 의미합니다."),
]

# 과목별 시스템 프롬프트
_KO = " 문제와 해설은 반드시 한국어로 작성하세요. 선택지는 해당 과목의 특성에 맞게 작성하세요(코드, 수식, 외국어 표현 등은 그대로 사용 가능)."

SUBJECT_PROMPTS = {
    "영어": "당신은 영어 교육 전문가입니다. 영어 어휘, 문법, 독해 문제를 출제합니다. 문제는 한국어로 작성하고 영어 예문/어휘를 포함하세요." + _KO,
    "국사": "당신은 한국사 교육 전문가입니다. 한국 역사 관련 문제를 출제합니다." + _KO,
    "파이썬": "당신은 Python 프로그래밍 교육 전문가입니다. Python 문법, 자료형, 리스트/딕셔너리/셋, 함수, 클래스, 데코레이터, 제너레이터, 표준 라이브러리 등 문제를 출제합니다." + _KO,
    "자바스크립트": "당신은 JavaScript 프로그래밍 교육 전문가입니다. ES6+ 문법, 클로저, 프로토타입, 비동기(Promise/async-await), DOM, 이벤트, 모듈 시스템 등 문제를 출제합니다." + _KO,
    "C++": "당신은 C++ 프로그래밍 교육 전문가입니다. 포인터, 참조, 메모리 관리, STL(vector/map/set), 템플릿, 클래스, 상속, 가상함수, RAII 등 문제를 출제합니다." + _KO,
    "일본어": (
        "당신은 일본어 교육 전문가입니다. 문제는 한국어로 작성하고 일본어 예문을 포함하세요. " + _KO + "\n"
        "난이도 기준을 반드시 준수하세요:\n"
        "- EASY(쉬운): JLPT N5 수준. 히라가나/가타카나 읽기, 숫자/날짜/요일, 기초 인사말, "
        "단순 조사(は・が・を・に・で), です/ます 형, 초등 수준 어휘(100개 이내).\n"
        "- MEDIUM(보통): JLPT N4~N3 수준. て형/た형/ない형 활용, 조건형(と・ば・たら・なら), "
        "비교 표현, 수수동사(あげる・もらう・くれる), N3 어휘(300~600개 수준), 경어 기초.\n"
        "- HARD(어려운): JLPT N2~N1 수준. 복합동사, 고급 경어(謙譲語・尊敬語), "
        "문어체 문법(〜において・〜に関して), N1 어휘, 사역수동형, 고급 접속표현."
    ),
    "데이터베이스": "당신은 데이터베이스 교육 전문가입니다. SQL, 정규화, 인덱스, 트랜잭션, ACID, 조인, 뷰 등 데이터베이스 문제를 출제합니다." + _KO,
    "자바": "당신은 Java 프로그래밍 교육 전문가입니다. OOP, JVM, 컬렉션 프레임워크, 제네릭, 예외처리, 멀티스레딩, 람다 등 Java 문제를 출제합니다." + _KO,
    "스프링": "당신은 Spring 프레임워크 교육 전문가입니다. IoC/DI, AOP, Spring MVC, Spring Boot, JPA, 트랜잭션 관리 등 Spring 문제를 출제합니다." + _KO,
    "default": "당신은 교육 전문가입니다. 주어진 과목의 문제를 출제합니다." + _KO,
}

DIFFICULTY_MAP = {"EASY": "쉬운", "MEDIUM": "보통", "HARD": "어려운"}

# 과목별 소주제 목록 — 각 문제에 다른 소주제를 배정하여 다양성 확보
SUBJECT_TOPICS = {
    "영어": ["어휘(단어 뜻/동의어)", "문법(시제)", "문법(조동사)", "문법(가정법)", "문법(수동태)",
             "문법(전치사)", "문법(접속사)", "문법(관계사)", "어휘(숙어/관용표현)", "독해(빈칸 추론)"],
    "국사": ["선사/고조선", "삼국시대", "남북국시대", "고려시대", "조선 전기", "조선 후기",
             "개화기/근대", "일제강점기", "광복/현대", "사회·경제·문화사"],
    "파이썬": ["기본 자료형(int/float/str/bool)", "리스트/튜플", "딕셔너리/셋", "조건문/반복문",
               "함수(정의/인자/반환)", "클래스/OOP", "예외처리", "파일입출력", "표준라이브러리",
               "데코레이터/제너레이터", "comprehension", "lambda/map/filter"],
    "자바스크립트": ["변수(var/let/const)/스코프", "자료형/형변환", "함수/화살표함수", "클로저",
                    "프로토타입/상속", "비동기(콜백/Promise)", "async/await", "DOM/이벤트",
                    "ES6+ 문법(구조분해/스프레드)", "모듈(import/export)", "배열 메서드"],
    "C++": ["포인터/참조", "메모리 관리(new/delete)", "클래스/생성자/소멸자", "상속/다형성",
            "가상함수/추상클래스", "템플릿", "STL(vector/list)", "STL(map/set)", "RAII/스마트포인터",
            "예외처리", "연산자 오버로딩"],
    "일본어": ["히라가나/가타카나 읽기", "기초 조사", "동사 활용(て형/た형)", "동사 활용(ない형/조건형)",
               "형용사 활용", "경어(존경어/겸양어)", "수수동사", "복합동사", "어휘", "문어체 문법"],
    "데이터베이스": ["SELECT/WHERE/ORDER BY", "JOIN(INNER/LEFT/RIGHT)", "GROUP BY/집계함수",
                    "서브쿼리", "인덱스", "정규화(1NF/2NF/3NF)", "트랜잭션/ACID", "DDL(CREATE/ALTER/DROP)",
                    "뷰/저장프로시저", "NoSQL 개념"],
    "자바": ["기본 자료형/래퍼클래스", "OOP(캡슐화/상속/다형성)", "인터페이스/추상클래스",
             "예외처리(try-catch)", "컬렉션(List/Map/Set)", "제네릭", "람다/스트림API",
             "멀티스레딩/동기화", "JVM/메모리구조", "입출력(I/O)"],
    "스프링": ["IoC/DI", "AOP", "Spring MVC(@Controller/@RequestMapping)", "Spring Boot 자동설정",
               "JPA 엔티티/연관관계", "JPQL/쿼리메서드", "@Transactional", "Spring Security 인증/인가",
               "REST API 설계", "테스트(MockMvc/JUnit)"],
    "default": [],
}

JAPANESE_DIFFICULTY_GUIDE = {
    "EASY":   "JLPT N5 수준만 출제. 히라가나/가타카나 읽기, 기초 조사, です/ます체, 초등 어휘만 사용.",
    "MEDIUM": "JLPT N4~N3 수준만 출제. て형/た형/ない형 활용, 조건형, 수수동사, N3 어휘 범위.",
    "HARD":   "JLPT N2~N1 수준만 출제. 복합동사, 고급 경어, 문어체 문법, N1 어휘, 사역수동형.",
}


async def _generate_one_problem_async(subject: str, difficulty_kor: str, system_prompt: str, topic: str = "", difficulty_note: str = "") -> Problem | None:
    """단일 문제 비동기 생성 (스트리밍용)"""
    topic_line = f"\n반드시 다음 소주제로 출제하세요: [{topic}]" if topic else ""
    prompt = f"""[{subject}] {difficulty_kor} 난이도 객관식(4지선다) 문제 1개를 만들어주세요.{difficulty_note}{topic_line}

중요: 문제, 선택지 모두 반드시 한국어로 작성하세요. 코드 스니펫이 포함되는 경우에만 해당 프로그래밍 언어를 사용하되, 설명 부분은 한국어로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "problems": [
    {{
      "type": "MULTIPLE",
      "question": "문제 내용 (한국어)",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": "선택지1"
    }}
  ]
}}
- choices는 정확히 4개
- answer는 choices 중 하나와 정확히 일치해야 함"""

    response = await async_client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content)
    problems = data.get("problems", [])
    return Problem(**problems[0]) if problems else None


async def generate_problems_stream(subject: str, difficulty: str, count: int):
    """N개 문제를 병렬로 생성하고 완료되는 순서대로 yield"""
    if USE_MOCK:
        for p in MOCK_PROBLEMS[:count]:
            await asyncio.sleep(0.3)
            yield p
        return

    import random
    system_prompt = SUBJECT_PROMPTS.get(subject, SUBJECT_PROMPTS["default"])
    difficulty_kor = DIFFICULTY_MAP.get(difficulty, "보통")
    difficulty_note = ""
    if subject == "일본어":
        difficulty_note = f"\n난이도 엄수: {JAPANESE_DIFFICULTY_GUIDE.get(difficulty, '')} 이 기준을 벗어난 문제는 절대 출제하지 마세요."

    # 소주제 목록에서 count개 무작위 배정 (중복 최소화)
    topics = SUBJECT_TOPICS.get(subject, [])
    if topics:
        shuffled = random.sample(topics, min(len(topics), count))
        # count가 소주제 수보다 많으면 반복 사용 (단, 순서 셔플)
        while len(shuffled) < count:
            extra = random.sample(topics, min(len(topics), count - len(shuffled)))
            shuffled += extra
        assigned_topics = shuffled[:count]
    else:
        assigned_topics = [""] * count

    tasks = [
        asyncio.ensure_future(_generate_one_problem_async(subject, difficulty_kor, system_prompt, assigned_topics[i], difficulty_note))
        for i in range(count)
    ]
    for coro in asyncio.as_completed(tasks):
        try:
            problem = await coro
            if problem:
                yield problem
        except Exception:
            pass


def generate_problems(subject: str, difficulty: str, count: int, type: str) -> list[Problem]:
    """AI가 학습 문제 생성"""

    if USE_MOCK:
        return MOCK_PROBLEMS[:count]

    system_prompt = SUBJECT_PROMPTS.get(subject, SUBJECT_PROMPTS["default"])
    difficulty_kor = DIFFICULTY_MAP.get(difficulty, "보통")

    difficulty_note = ""
    if subject == "일본어":
        difficulty_note = f"\n난이도 엄수: {JAPANESE_DIFFICULTY_GUIDE.get(difficulty, '')} 이 기준을 벗어난 문제는 절대 출제하지 마세요."

    import random
    topics = SUBJECT_TOPICS.get(subject, [])
    topic_line = ""
    if topics:
        shuffled = random.sample(topics, min(len(topics), count))
        while len(shuffled) < count:
            shuffled += random.sample(topics, min(len(topics), count - len(shuffled)))
        topic_list = ", ".join(f"문제{i+1}:[{t}]" for i, t in enumerate(shuffled[:count]))
        topic_line = f"\n각 문제의 소주제를 다음과 같이 배정합니다: {topic_list}"

    prompt = f"""[{subject}] {difficulty_kor} 난이도 객관식(4지선다) 문제 {count}개를 만들어주세요.{difficulty_note}{topic_line}

중요: 문제, 선택지 모두 반드시 한국어로 작성하세요. 코드 스니펫이 포함되는 경우에만 해당 프로그래밍 언어를 사용하되, 설명 부분은 한국어로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "problems": [
    {{
      "type": "MULTIPLE",
      "question": "문제 내용 (한국어)",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": "선택지1"
    }}
  ]
}}
- type은 항상 "MULTIPLE"
- choices는 정확히 4개
- answer는 choices 중 하나와 정확히 일치해야 함
- 문제는 반드시 한국어로 작성"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return [Problem(**p) for p in data["problems"]]


def grade_answer(question: str, correct_answer: str, user_answer: str, explanation: str = "") -> GradeResponse:
    """사용자 답안 채점 및 AI 피드백 생성"""

    if USE_MOCK:
        is_correct = user_answer.strip() == correct_answer.strip()
        feedback = f"{'정답입니다!' if is_correct else f'오답입니다. 정답은 [{correct_answer}]입니다.'}"
        return GradeResponse(isCorrect=is_correct, aiFeedback=feedback)

    explanation_line = f"참고 해설: {explanation}\n" if explanation else ""
    prompt = f"""문제: {question}
정답: {correct_answer}
{explanation_line}사용자 답안: {user_answer}

사용자 답안이 정답인지 판단하고, 왜 맞았는지 또는 왜 틀렸는지 친절하게 설명해주세요.

주의사항:
- 문법적으로 정확한 설명만 작성하세요. 확실하지 않으면 추측하지 마세요.
- 일본어 문법 문제의 경우 동사 활용(て형·た형·ない형 등) 규칙을 정확히 적용하세요.
- 오답 분석 시 사용자 답이 왜 틀렸는지 정확한 근거로만 설명하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{"isCorrect": true 또는 false, "aiFeedback": "피드백 내용"}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 정확한 지식을 갖춘 교육 튜터입니다. 특히 언어(일본어, 영어 등) 문법 설명 시 틀린 정보를 제공하지 않도록 주의하세요. 불확실한 내용은 단정하지 말고, 정확한 근거에 기반해 설명하세요."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return GradeResponse(**data)


PLACEMENT_SUBJECTS = ["영어", "자료구조", "알고리즘", "운영체제", "네트워크", "데이터베이스", "자바", "스프링", "국사"]

MOCK_PLACEMENT_PROBLEMS = [
    PlacementProblem(subject="영어", level=1, question="다음 빈칸에 알맞은 단어는?\n'I ___ a student.'", choices=["am", "is", "are", "be"], answer="am"),
    PlacementProblem(subject="영어", level=2, question="다음 문장의 수동태로 올바른 것은?\n'The chef cooks the meal.'", choices=["The meal is cooked by the chef.", "The meal was cooked by the chef.", "The meal is cooking by the chef.", "The meal cooked by the chef."], answer="The meal is cooked by the chef."),
    PlacementProblem(subject="자료구조", level=1, question="스택(Stack)의 특성으로 올바른 것은?", choices=["FIFO", "LIFO", "랜덤 접근", "양방향 접근"], answer="LIFO"),
    PlacementProblem(subject="자료구조", level=2, question="이진 탐색 트리에서 탐색의 평균 시간 복잡도는?", choices=["O(1)", "O(log n)", "O(n)", "O(n²)"], answer="O(log n)"),
    PlacementProblem(subject="알고리즘", level=1, question="버블 정렬의 시간 복잡도는?", choices=["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer="O(n²)"),
    PlacementProblem(subject="알고리즘", level=3, question="다익스트라 알고리즘이 처리할 수 없는 경우는?", choices=["음수 가중치 간선", "방향 그래프", "비연결 그래프", "가중치가 같은 간선"], answer="음수 가중치 간선"),
    PlacementProblem(subject="운영체제", level=1, question="프로세스와 스레드의 차이점으로 올바른 것은?", choices=["스레드는 독립적인 메모리를 가진다", "프로세스는 메모리를 공유한다", "스레드는 프로세스 내에서 메모리를 공유한다", "프로세스와 스레드는 동일하다"], answer="스레드는 프로세스 내에서 메모리를 공유한다"),
    PlacementProblem(subject="운영체제", level=2, question="교착상태(Deadlock) 발생 조건이 아닌 것은?", choices=["상호 배제", "점유와 대기", "선점 가능", "순환 대기"], answer="선점 가능"),
    PlacementProblem(subject="네트워크", level=1, question="HTTP의 기본 포트 번호는?", choices=["21", "22", "80", "443"], answer="80"),
    PlacementProblem(subject="네트워크", level=2, question="TCP와 UDP의 차이점으로 올바른 것은?", choices=["UDP는 연결 지향적이다", "TCP는 비연결형이다", "TCP는 신뢰성 있는 전송을 보장한다", "UDP는 흐름 제어를 지원한다"], answer="TCP는 신뢰성 있는 전송을 보장한다"),
    PlacementProblem(subject="데이터베이스", level=1, question="SQL에서 테이블의 모든 행을 삭제하는 명령어는?", choices=["DROP", "DELETE", "TRUNCATE", "REMOVE"], answer="DELETE"),
    PlacementProblem(subject="데이터베이스", level=2, question="데이터베이스 인덱스에 대한 설명으로 올바른 것은?", choices=["항상 성능을 향상시킨다", "쓰기 성능을 향상시킨다", "읽기 성능을 향상시키지만 쓰기 비용이 증가한다", "메모리 사용량을 줄인다"], answer="읽기 성능을 향상시키지만 쓰기 비용이 증가한다"),
    PlacementProblem(subject="자바", level=1, question="Java에서 final 키워드의 역할이 아닌 것은?", choices=["변수를 상수로 선언", "메서드 오버라이딩 금지", "클래스 상속 금지", "메서드 오버로딩 금지"], answer="메서드 오버로딩 금지"),
    PlacementProblem(subject="자바", level=2, question="Java에서 인터페이스와 추상 클래스의 차이점은?", choices=["인터페이스는 다중 구현 불가", "추상 클래스는 다중 상속 가능", "인터페이스는 다중 구현 가능", "추상 클래스는 인스턴스화 가능"], answer="인터페이스는 다중 구현 가능"),
    PlacementProblem(subject="스프링", level=1, question="Spring의 IoC(Inversion of Control)란?", choices=["개발자가 객체를 직접 생성·관리", "프레임워크가 객체 생성·관리를 담당", "DB 연결을 자동화", "예외 처리를 자동화"], answer="프레임워크가 객체 생성·관리를 담당"),
    PlacementProblem(subject="스프링", level=2, question="Spring @Transactional의 기본 격리 수준은?", choices=["READ_UNCOMMITTED", "READ_COMMITTED", "REPEATABLE_READ", "DEFAULT(DB 기본값)"], answer="DEFAULT(DB 기본값)"),
    PlacementProblem(subject="국사", level=1, question="조선을 건국한 인물은?", choices=["왕건", "이성계", "광개토대왕", "세종대왕"], answer="이성계"),
    PlacementProblem(subject="영어", level=3, question="'Had I known earlier, I would have acted differently.'에서 사용된 문법은?", choices=["가정법 현재", "가정법 과거", "가정법 과거완료", "직설법"], answer="가정법 과거완료"),
    PlacementProblem(subject="자료구조", level=3, question="해시 테이블에서 충돌 해결 방법이 아닌 것은?", choices=["체이닝(Chaining)", "개방 주소법(Open Addressing)", "이중 해싱(Double Hashing)", "버블 정렬(Bubble Sort)"], answer="버블 정렬(Bubble Sort)"),
    PlacementProblem(subject="네트워크", level=3, question="TLS 핸드셰이크 과정에서 가장 먼저 일어나는 것은?", choices=["인증서 교환", "대칭 키 생성", "ClientHello 전송", "서버 인증"], answer="ClientHello 전송"),
]


def get_hint(question: str, choices: list[str], subject: str, difficulty: str) -> HintResponse:
    """문제 힌트 생성 (정답을 직접 알려주지 않음)"""

    choices_text = "\n".join([f"{i+1}. {c}" for i, c in enumerate(choices)])

    prompt = f"""다음 문제에 대한 힌트를 한국어로 작성해주세요.

문제: {question}
선택지:
{choices_text}

힌트 작성 규칙:
- 정답을 직접 말하거나 암시하지 마세요
- 문제를 풀기 위한 핵심 개념이나 접근 방법을 알려주세요
- 2~3문장으로 간결하게 작성하세요
- 오답을 제거하는 방식은 사용하지 마세요

반드시 아래 JSON 형식으로만 응답하세요:
{{"hint": "힌트 내용"}}"""

    if USE_MOCK:
        return HintResponse(hint="핵심 개념을 떠올려보세요. 관련 이론을 복습하면 도움이 됩니다.")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"당신은 친절한 {subject} 교육 튜터입니다. 학생이 스스로 답을 찾을 수 있도록 힌트를 제공합니다."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return HintResponse(hint=data["hint"])


def generate_placement_problems(count: int) -> list[PlacementProblem]:
    """수준 진단 테스트 문제 생성"""

    if USE_MOCK:
        return MOCK_PLACEMENT_PROBLEMS[:count]

    prompt = f"""수준 진단 테스트용 문제 {count}개를 만들어주세요.

과목 목록: 영어, 파이썬, 자바스크립트, C++, 일본어, 데이터베이스, 자바, 스프링, 국사
난이도 분포: level 1(기초) {count//3}개, level 2(중급) {count//3}개, level 3(고급) {count - 2*(count//3)}개
형식: 모두 객관식 4지선다, 각 과목이 고르게 분포되도록

중요: 문제, 선택지 모두 반드시 한국어로 작성하세요. 코드 스니펫이 포함될 경우에만 해당 언어 사용 가능하며 나머지는 한국어로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{{
  "problems": [
    {{
      "subject": "과목명",
      "level": 1,
      "question": "문제 내용 (한국어)",
      "choices": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": "정답(choices 중 하나와 정확히 일치)"
    }}
  ]
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 IT 기술 및 일반 교육 전문가입니다. 취업 준비생을 위한 수준 진단 문제를 출제합니다. 모든 문제와 선택지는 반드시 한국어로 작성하세요."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return [PlacementProblem(**p) for p in data["problems"]]
