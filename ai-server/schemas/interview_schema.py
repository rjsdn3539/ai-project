from pydantic import BaseModel
from typing import List, Optional, Any


class ConversationTurn(BaseModel):
    question: str
    answer: str


class QuestionRequest(BaseModel):
    resumeContent: str
    coverLetterContent: str
    jobDescription: str
    conversationHistory: List[ConversationTurn] = []


class QuestionResponse(BaseModel):
    question: str
    questionType: str  # INITIAL | FOLLOWUP


class FeedbackRequest(BaseModel):
    conversationHistory: List[ConversationTurn]


class FeedbackResponse(BaseModel):
    logicScore: int
    relevanceScore: int
    specificityScore: int
    overallScore: int
    weakPoints: str
    improvements: str
    recommendedAnswer: str


# Java 백엔드 연동용 스키마
class BatchQuestionsRequest(BaseModel):
    positionTitle: str
    resumeSummary: Optional[str] = ""
    jobDescription: Optional[str] = ""
    questionCount: int = 5
    difficulty: Optional[str] = "MEDIUM"  # "EASY" | "MEDIUM" | "HARD"


class QuestionItem(BaseModel):
    sequenceNumber: int
    questionText: str


class BatchQuestionsResponse(BaseModel):
    questions: List[QuestionItem]


class AnalyzeAnswerRequest(BaseModel):
    questionText: str
    answerText: str
    jobDescription: Optional[str] = ""


class AnalyzeAnswerResponse(BaseModel):
    relevanceScore: int
    logicScore: int
    specificityScore: int
    overallScore: int
    feedbackSummary: str


class ReportSummaryRequest(BaseModel):
    sessionTitle: str
    positionTitle: Optional[str] = ""
    answerFeedback: List[Any] = []


class ReportSummaryResponse(BaseModel):
    weakPoints: str
    improvements: str
    recommendedAnswer: str


class ParseJobPostingRequest(BaseModel):
    url: Optional[str] = None
    content: Optional[str] = None


class ParseJobPostingResponse(BaseModel):
    companyName: str
    positionTitle: str
    description: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class InterviewChatRequest(BaseModel):
    messages: List[ChatMessage]
    weakPoints: Optional[str] = ""
    improvements: Optional[str] = ""
    recommendedAnswer: Optional[str] = ""
    positionTitle: Optional[str] = ""


class InterviewChatResponse(BaseModel):
    reply: str


class LearningTopicsRequest(BaseModel):
    weakPoints: Optional[str] = ""
    improvements: Optional[str] = ""
    positionTitle: Optional[str] = ""


class LearningTopicItem(BaseModel):
    topic: str      # 구체적 개념 (예: "가비지 컬렉션", "B-Tree 인덱스")
    subject: str    # 과목 (예: "자바", "데이터베이스")
    reason: str     # 추천 이유 (한 문장)


class LearningTopicsResponse(BaseModel):
    topics: List[LearningTopicItem]
