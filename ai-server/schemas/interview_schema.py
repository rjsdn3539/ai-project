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
