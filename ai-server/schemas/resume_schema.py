from pydantic import BaseModel
from typing import List


class ResumeReviewRequest(BaseModel):
    content: str
    documentType: str = "resume"  # "resume" | "coverLetter"


class ResumeReviewResponse(BaseModel):
    overall: str
    strengths: List[str]
    improvements: List[str]
    revisedSuggestions: List[str]
