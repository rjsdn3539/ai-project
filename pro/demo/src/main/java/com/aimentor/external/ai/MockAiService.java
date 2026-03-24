package com.aimentor.external.ai;

import com.aimentor.external.ai.dto.FeedbackDto;
import com.aimentor.external.ai.dto.GradeResultDto;
import com.aimentor.external.ai.dto.ProblemDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * AI 서버 없이 테스트할 수 있는 Mock 구현체
 * application.yml: ai.service.mock=true  → 이 빈이 활성화됨
 * 실제 배포에서는 PythonAiService가 사용됨
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.service.mock", havingValue = "true", matchIfMissing = true)
public class MockAiService implements AiService {

    @Override
    public String generateInterviewQuestion(String resumeContent, String coverLetterContent,
                                            String jobDescription, List<QAHistory> history) {
        log.info("[MockAI] generateInterviewQuestion called (history size: {})", history.size());
        if (history.isEmpty()) {
            return "자기소개를 부탁드립니다.";
        }
        return "방금 답변에서 언급하신 내용 중 가장 어려웠던 경험은 무엇인가요?";
    }

    @Override
    public FeedbackDto generateFeedback(List<QAHistory> history) {
        log.info("[MockAI] generateFeedback called");
        return new FeedbackDto(80, 85, 75, 80,
                "답변이 다소 추상적입니다.",
                "구체적인 수치나 사례를 들어 답변하면 좋습니다.",
                "저는 A 프로젝트에서 B 문제를 C 방법으로 해결하여 D 결과를 달성했습니다.");
    }

    @Override
    public List<ProblemDto> generateLearningProblems(String subject, String difficulty, int count) {
        log.info("[MockAI] generateLearningProblems: {} {} {}", subject, difficulty, count);
        return List.of(
                new ProblemDto("MULTIPLE", "다음 중 올바른 것은?",
                        List.of("① 보기1", "② 보기2", "③ 보기3", "④ 보기4"), "① 보기1", "해설입니다."),
                new ProblemDto("SHORT", "빈칸에 알맞은 단어는?", null, "정답", "해설입니다.")
        );
    }

    @Override
    public GradeResultDto gradeLearningAnswer(String question, String correctAnswer, String userAnswer) {
        log.info("[MockAI] gradeLearningAnswer");
        boolean correct = correctAnswer.trim().equalsIgnoreCase(userAnswer.trim());
        String feedback = correct ? "정답입니다!" : "틀렸습니다. 정답은 '" + correctAnswer + "'입니다.";
        return new GradeResultDto(correct, feedback);
    }
}
