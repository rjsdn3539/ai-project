from pydantic import BaseModel
from typing import List, Optional


class GenerateRequest(BaseModel):
    subject: str        # 영어, 국사 등
    difficulty: str     # EASY | MEDIUM | HARD
    count: int = 4
    type: str = "MIX"   # MULTIPLE | SHORT | MIX


class Problem(BaseModel):
    type: str           # MULTIPLE | SHORT
    question: str
    choices: Optional[List[str]] = None
    answer: str
    explanation: Optional[str] = None


class GenerateResponse(BaseModel):
    problems: List[Problem]


class GradeRequest(BaseModel):
    question: str
    correctAnswer: str
    userAnswer: str
    explanation: Optional[str] = None


class GradeResponse(BaseModel):
    isCorrect: bool
    aiFeedback: str


class HintRequest(BaseModel):
    question: str
    choices: List[str]
    subject: str = ""
    difficulty: str = "MEDIUM"


class HintResponse(BaseModel):
    hint: str


class PlacementGenerateRequest(BaseModel):
    count: int = 20


class PlacementProblem(BaseModel):
    subject: str
    level: int          # 1=기초, 2=중급, 3=고급
    question: str
    choices: List[str]  # 항상 4지선다
    answer: str


class PlacementGenerateResponse(BaseModel):
    problems: List[PlacementProblem]
