# AI Usage Log

## Prompt 1 — Curriculum-Aware Question Generation

Purpose:

Generate one realistic technical interview question using:

- Candidate profile
- Completed cohort missions
- Curriculum objectives
- Previous interview answers
- Current interview difficulty

The AI must ask exactly one question.

---

## Prompt 2 — Answer Evaluation

Purpose:

Evaluate a candidate's answer on:

- Technical correctness
- Depth
- Reasoning
- Practical application
- Clarity

The evaluator returns structured JSON.

---

## Prompt 3 — Adaptive Difficulty

The interview engine uses the previous answer score.

### Score >= 8

Increase difficulty.

The next question can focus on:

- Architecture
- Debugging
- Scalability
- Trade-offs
- Production scenarios

### Score 6–7.9

Maintain intermediate difficulty.

### Score < 6

Probe the weak area with a foundation or clarification question.

---

## Prompt 4 — Final Feedback

Generate:

- Overall summary
- Strengths
- Technical gaps
- Recommended next steps
- Competency scorecard
- Curriculum coverage

The system does not make a hiring or rejection decision.

---

# Human Engineering Decisions

1. Candidate data and curriculum are the source of truth.

2. Skipped or failed missions are not selected as normal interview topics.

3. The interview contains 8 questions.

4. The planner targets at least 4 different curriculum days.

5. Interview state is maintained using `sessionId`.

6. Previous answers influence the next question.

7. Strong answers increase difficulty.

8. Weak answers trigger focused probing.

9. AI output is constrained to JSON where structured data is required.

10. The UI exposes a short interview-strategy explanation rather than hidden chain-of-thought.

11. Final feedback contains actionable learning recommendations.

12. Candidate learning signals such as completed missions and attempts influence interview selection.