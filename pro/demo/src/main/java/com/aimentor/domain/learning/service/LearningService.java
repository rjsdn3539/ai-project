package com.aimentor.domain.learning.service;

import com.aimentor.common.exception.BusinessException;
import com.aimentor.domain.learning.dto.LearningDto;
import com.aimentor.domain.learning.entity.LearningAttempt;
import com.aimentor.domain.learning.entity.LearningProblem;
import com.aimentor.domain.learning.repository.LearningAttemptRepository;
import com.aimentor.domain.learning.repository.LearningProblemRepository;
import com.aimentor.external.ai.AiService;
import com.aimentor.external.ai.dto.GradeResultDto;
import com.aimentor.external.ai.dto.ProblemDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LearningService {

    private final LearningProblemRepository problemRepo;
    private final LearningAttemptRepository attemptRepo;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    /** 문제 생성 */
    @Transactional
    public List<LearningDto.ProblemResponse> generate(LearningDto.GenerateRequest req) {
        List<ProblemDto> problems = aiService.generateLearningProblems(
                req.getSubject(), req.getDifficulty(), req.getCount());

        return problems.stream().map(p -> {
            String choicesJson = null;
            if (p.getChoices() != null) {
                try { choicesJson = objectMapper.writeValueAsString(p.getChoices()); }
                catch (JsonProcessingException e) { choicesJson = "[]"; }
            }
            LearningProblem entity = LearningProblem.builder()
                    .subject(req.getSubject()).difficulty(req.getDifficulty())
                    .type(p.getType()).question(p.getQuestion())
                    .choicesJson(choicesJson).answer(p.getAnswer())
                    .explanation(p.getExplanation()).build();
            entity = problemRepo.save(entity);
            return new LearningDto.ProblemResponse(entity.getId(), entity.getType(),
                    entity.getQuestion(), p.getChoices());
        }).toList();
    }

    /** 답변 제출 & 채점 */
    @Transactional
    public LearningDto.AttemptResponse attempt(LearningDto.AttemptRequest req, Long userId) {
        LearningProblem problem = problemRepo.findById(req.getProblemId())
                .orElseThrow(() -> BusinessException.notFound("문제를 찾을 수 없습니다."));

        GradeResultDto result = aiService.gradeLearningAnswer(
                problem.getQuestion(), problem.getAnswer(), req.getUserAnswer());

        LearningAttempt attempt = LearningAttempt.builder()
                .userId(userId).problem(problem)
                .userAnswer(req.getUserAnswer())
                .isCorrect(result.getIsCorrect())
                .aiFeedback(result.getAiFeedback())
                .build();
        attemptRepo.save(attempt);

        return new LearningDto.AttemptResponse(
                result.getIsCorrect(), problem.getAnswer(), result.getAiFeedback());
    }
}
