import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const candidates = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "candidates.json"),
    "utf8"
  )
).candidates;

const curriculum = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "curriculum.json"),
    "utf8"
  )
);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })
  : null;

const sessions = new Map();

const TOTAL_QUESTIONS = 8;
const MIN_CURRICULUM_DAYS = 4;

/* ---------------- BASIC ROUTES ---------------- */

app.get("/", (req, res) => {
  res.json({
    message: "AI Interview Agent backend is running.",
    endpoint: "POST /api/interview"
  });
});

app.get("/api/candidates", (req, res) => {
  res.json(candidates);
});

/* ---------------- DATA HELPERS ---------------- */

function getCompletedMissions(candidate) {
  return (candidate.missions || [])
    .filter(
      (mission) =>
        mission.passed === true &&
        mission.skipped !== true
    )
    .map((mission) => ({
      ...mission,
      attempts: Number(mission.attempts || 1)
    }));
}

function curriculumDay(day) {
  return curriculum.days.find(
    (item) => item.day === day
  );
}

function uniqueByDay(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (seen.has(item.day)) {
      return false;
    }

    seen.add(item.day);
    return true;
  });
}

/* ---------------- INTERVIEW PLANNER ---------------- */

function buildInterviewPlan(candidate) {
  const completed =
    getCompletedMissions(candidate);

  if (!completed.length) {
    return [];
  }

  const preferredDays = [
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    16,
    18,
    20,
    21,
    22,
    23,
    24,
    25,
    27,
    28,
    29,
    30,
    31,
    1,
    2,
    3,
    4,
    5,
    6,
    14,
    15,
    17,
    19,
    26
  ];

  const byDay = new Map(
    completed.map((mission) => [
      mission.day,
      mission
    ])
  );

  const ordered = preferredDays
    .filter((day) => byDay.has(day))
    .map((day) => byDay.get(day));

  const remaining = completed.filter(
    (mission) =>
      !ordered.some(
        (item) => item.day === mission.day
      )
  );

  const candidatesOrdered = [
    ...ordered,
    ...remaining
  ];

  /*
    First use unique curriculum days.
    This guarantees broad curriculum coverage.
  */

  const uniqueDays =
    uniqueByDay(candidatesOrdered);

  const plan = uniqueDays.slice(
    0,
    Math.min(
      TOTAL_QUESTIONS,
      uniqueDays.length
    )
  );

  /*
    If fewer than 8 unique completed days exist,
    reuse eligible topics for deeper questions.
  */

  let index = 0;

  while (plan.length < TOTAL_QUESTIONS) {
    plan.push(
      candidatesOrdered[
        index % candidatesOrdered.length
      ]
    );

    index++;
  }

  return plan;
}

/* ---------------- ADAPTIVE DIFFICULTY ---------------- */

function difficultyForScore(score) {
  if (score >= 8.5) {
    return "advanced";
  }

  if (score >= 6) {
    return "intermediate";
  }

  return "foundational";
}

/* ---------------- JSON HELPER ---------------- */

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match =
      text?.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

/* ---------------- FALLBACK QUESTION ---------------- */

function fallbackQuestion(
  mission,
  candidate,
  state
) {
  const day =
    curriculumDay(mission.day);

  const objective =
    day?.objectives?.[0] ||
    "the main concepts from this topic";

  if (
    state.weakTopics.includes(
      mission.day
    )
  ) {
    return `
Let's revisit Day ${mission.day},
"${mission.title}".

Explain the part of this topic you
find most challenging and how you
would apply it in a real
${candidate.member.jobRole} project.

Address this objective:

${objective}
`.trim();
  }

  if (state.difficulty === "advanced") {
    return `
You demonstrated strong understanding
of Day ${mission.day}, "${mission.title}".

Now consider a production scenario:

How would you design, debug, optimize,
or scale a system using this concept?

Explain your trade-offs and failure
handling strategy.
`.trim();
  }

  return `
You completed Day ${mission.day},
"${mission.title}".

Explain how you would apply this concept
in a real ${candidate.member.jobRole} project.

Address this objective:

${objective}
`.trim();
}

/* ---------------- AI QUESTION GENERATION ---------------- */

async function generateInterviewQuestion(
  session,
  mission,
  previousAnswer = ""
) {
  const day =
    curriculumDay(mission.day);

  const state =
    session.interviewState;

  if (!ai) {
    return fallbackQuestion(
      mission,
      session.candidate,
      state
    );
  }

  const previousQuestions =
    session.history.map(
      (item) => item.question
    );

  const prompt = `
You are a realistic senior enterprise
AI technical interviewer.

CANDIDATE:
${JSON.stringify(
  session.candidate.member
)}

LEARNING JOURNEY:
${JSON.stringify(
  session.candidate.missions
)}

CURRENT CURRICULUM TARGET:

Day ${mission.day}
Title: ${mission.title}

Type:
${day?.type}

Tools:
${JSON.stringify(day?.tools || [])}

Objectives:
${JSON.stringify(day?.objectives || [])}

CURRENT INTERVIEW STATE:
${JSON.stringify({
  ...state,
  strongTopics: [
    ...state.strongTopics
  ],
  weakTopics: [
    ...state.weakTopics
  ]
})}

PREVIOUS ANSWER:
${previousAnswer || "First question."}

QUESTIONS ALREADY ASKED:
${JSON.stringify(previousQuestions)}

QUESTION NUMBER:
${session.questionNumber + 1}
of ${TOTAL_QUESTIONS}

RULES:

1. Ask exactly ONE question.

2. Test only completed and
non-skipped missions.

3. Make it conversational.

4. Use the previous answer.

5. Current difficulty:
${state.difficulty}

6. Strong answer:
increase difficulty.

7. Weak answer:
probe the missing foundation.

8. Avoid repeating questions.

9. Prefer scenarios over definitions.

10. Ask about architecture,
debugging, scalability,
implementation or trade-offs.

11. Do not reveal hidden reasoning.

Return JSON only:

{
  "question": "..."
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json"
        }
      });

    const parsed =
      safeJson(response.text);

    if (parsed?.question) {
      return parsed.question;
    }
  } catch (error) {
    console.error(
      "Question generation failed:",
      error.message
    );
  }

  return fallbackQuestion(
    mission,
    session.candidate,
    state
  );
}

/* ---------------- ANSWER EVALUATION ---------------- */

async function evaluateAnswer(
  session,
  answer
) {
  const current =
    session.history[
      session.history.length - 1
    ];

  const day =
    curriculumDay(current.day);

  if (!ai) {
    const score = Math.min(
      10,
      Math.max(
        2,
        Math.round(
          answer.trim().length / 80
        )
      )
    );

    return {
      score,
      technicalCorrectness: score,
      depth: score,
      reasoning: score,
      clarity: score,

      strengths: [
        "The candidate attempted the question with relevant detail."
      ],

      weaknesses:
        score < 6
          ? [
              "The explanation needs more technical depth and concrete examples."
            ]
          : [],

      feedback:
        score < 6
          ? "Probe the concept further."
          : "The answer shows useful technical understanding."
    };
  }

  const prompt = `
Evaluate one answer in a senior
enterprise AI technical interview.

CANDIDATE:
${JSON.stringify(
  session.candidate.member
)}

CURRICULUM:

Day ${current.day}
${current.title}

Objectives:
${JSON.stringify(
  day?.objectives || []
)}

Tools:
${JSON.stringify(
  day?.tools || []
)}

QUESTION:
${current.question}

ANSWER:
${answer}

Evaluate:

- technical correctness
- depth
- reasoning
- practical application
- clarity

Do not reward length alone.

Return JSON only:

{
  "score": 0,
  "technicalCorrectness": 0,
  "depth": 0,
  "reasoning": 0,
  "clarity": 0,
  "strengths": [],
  "weaknesses": [],
  "feedback": ""
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json"
        }
      });

    const parsed =
      safeJson(response.text);

    if (
      parsed?.score !== undefined
    ) {
      return parsed;
    }
  } catch (error) {
    console.error(
      "Evaluation failed:",
      error.message
    );
  }

  return {
    score: 5,
    technicalCorrectness: 5,
    depth: 5,
    reasoning: 5,
    clarity: 5,

    strengths: [
      "The candidate provided an answer."
    ],

    weaknesses: [
      "The answer could not be fully evaluated."
    ],

    feedback:
      "Use a deeper technical example."
  };
}

/* ---------------- UPDATE MEMORY ---------------- */

function updateInterviewState(
  session,
  evaluation,
  mission
) {
  const state =
    session.interviewState;

  const score =
    Number(evaluation.score || 0);

  state.lastScore = score;

  state.difficulty =
    difficultyForScore(score);

  if (state.lastTopic === mission.day) {
    state.followUpsUsed++;
  }

  state.lastTopic =
    mission.day;

  if (score >= 8) {
    state.strongTopics.add(
      mission.day
    );
  }

  if (score < 6) {
    state.weakTopics.add(
      mission.day
    );
  }

  for (
    const strength of
    evaluation.strengths || []
  ) {
    state.strengths.add(
      strength
    );
  }

  for (
    const weakness of
    evaluation.weaknesses || []
  ) {
    state.gaps.add(
      weakness
    );
  }
}

function serializableState(state) {
  return {
    difficulty:
      state.difficulty,

    lastScore:
      state.lastScore,

    followUpsUsed:
      state.followUpsUsed,

    strongTopics:
      [...state.strongTopics],

    weakTopics:
      [...state.weakTopics],

    strengths:
      [...state.strengths].slice(
        0,
        5
      ),

    gaps:
      [...state.gaps].slice(
        0,
        5
      )
  };
}

/* ---------------- SCORECARD ---------------- */

function buildScorecard(session) {
  const evaluations =
    session.history.map(
      (item) =>
        item.evaluation || {}
    );

  function average(key) {
    const values =
      evaluations
        .map((item) =>
          Number(item[key])
        )
        .filter(
          (value) =>
            Number.isFinite(value)
        );

    if (!values.length) {
      return 0;
    }

    return Number(
      (
        values.reduce(
          (a, b) => a + b,
          0
        ) / values.length
      ).toFixed(1)
    );
  }

  return {
    overall:
      average("score"),

    technical:
      average(
        "technicalCorrectness"
      ),

    depth:
      average("depth"),

    reasoning:
      average("reasoning"),

    clarity:
      average("clarity")
  };
}

/* ---------------- FINAL FEEDBACK ---------------- */

async function generateFinalFeedback(
  session
) {
  const scorecard =
    buildScorecard(session);

  const coveredDays = [
    ...new Set(
      session.history.map(
        (item) => item.day
      )
    )
  ];

  const fallback = {
    summary:
      `Interview completed across ${coveredDays.length} curriculum days with an overall score of ${scorecard.overall}/10.`,

    strengths:
      [
        ...session
          .interviewState
          .strengths
      ].slice(0, 4),

    gaps:
      [
        ...session
          .interviewState
          .gaps
      ].slice(0, 4),

    next: [
      "Review the lowest-scoring topic and explain it without notes.",

      "Practice architecture and trade-off questions using production examples.",

      "Extend one cohort project independently and document the design decisions."
    ],

    scorecard,

    coveredDays
  };

  if (!ai) {
    return fallback;
  }

  const prompt = `
Create concise and actionable final
feedback for this enterprise AI
technical interview.

CANDIDATE:
${JSON.stringify(
  session.candidate.member
)}

COVERED DAYS:
${JSON.stringify(
  coveredDays
)}

INTERVIEW RESULTS:
${JSON.stringify(
  session.history
)}

Return JSON only:

{
  "summary": "...",

  "strengths": [
    "..."
  ],

  "gaps": [
    "..."
  ],

  "next": [
    "...",
    "...",
    "..."
  ],

  "scorecard": {
    "overall": 0,
    "technical": 0,
    "depth": 0,
    "reasoning": 0,
    "clarity": 0
  },

  "coveredDays": []
}

Do not make a hiring or rejection decision.
`;

  try {
    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json"
        }
      });

    const parsed =
      safeJson(response.text);

    if (
      parsed?.summary &&
      Array.isArray(
        parsed.strengths
      ) &&
      Array.isArray(
        parsed.gaps
      ) &&
      Array.isArray(
        parsed.next
      )
    ) {
      return {
        ...fallback,
        ...parsed,
        scorecard:
          parsed.scorecard ||
          scorecard,

        coveredDays:
          parsed.coveredDays ||
          coveredDays
      };
    }
  } catch (error) {
    console.error(
      "Final feedback failed:",
      error.message
    );
  }

  return fallback;
}

/* ---------------- REQUIRED API ---------------- */

app.post(
  "/api/interview",
  async (req, res) => {
    try {
      const {
        sessionId,
        candidate,
        message
      } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          error:
            "sessionId is required."
        });
      }

      /*
        START INTERVIEW
      */

      if (!sessions.has(sessionId)) {
        if (
          !candidate?.member?.id
        ) {
          return res.status(400).json({
            error:
              "candidate is required when starting a new interview."
          });
        }

        const suppliedCandidate =
          candidates.find(
            (item) =>
              item.member.id ===
              candidate.member.id
          ) || candidate;

        const plan =
          buildInterviewPlan(
            suppliedCandidate
          );

        const uniqueDays =
          new Set(
            plan.map(
              (mission) =>
                mission.day
            )
          );

        if (
          plan.length <
          TOTAL_QUESTIONS
        ) {
          return res.status(400).json({
            error:
              "Candidate does not have enough eligible completed missions."
          });
        }

        if (
          uniqueDays.size <
          MIN_CURRICULUM_DAYS
        ) {
          return res.status(400).json({
            error:
              `Candidate has only ${uniqueDays.size} eligible curriculum days.`
          });
        }

        const session = {
          sessionId,

          candidate:
            suppliedCandidate,

          plan,

          questionNumber: 0,

          history: [],

          currentQuestion: "",

          finished: false,

          interviewState: {
            difficulty:
              "intermediate",

            lastScore: 0,

            lastTopic: null,

            followUpsUsed: 0,

            strongTopics:
              new Set(),

            weakTopics:
              new Set(),

            strengths:
              new Set(),

            gaps:
              new Set()
          }
        };

        session.currentQuestion =
          await generateInterviewQuestion(
            session,
            plan[0]
          );

        sessions.set(
          sessionId,
          session
        );

        return res.json({
          reply:
            session.currentQuestion,

          done: false,

          questionNumber: 1,

          totalQuestions:
            TOTAL_QUESTIONS,

          day:
            plan[0].day,

          topic:
            plan[0].title,

          difficulty:
            session
              .interviewState
              .difficulty,

          coveredDays:
            [
              ...new Set(
                plan.map(
                  (m) => m.day
                )
              )
            ]
        });
      }

      /*
        EXISTING SESSION
      */

      const session =
        sessions.get(
          sessionId
        );

      if (session.finished) {
        return res.json({
          reply:
            "Interview already completed.",

          done: true,

          feedback:
            session.feedback
        });
      }

      if (!message?.trim()) {
        return res.status(400).json({
          error:
            "message is required."
        });
      }

      const currentMission =
        session.plan[
          session.questionNumber
        ];

      const historyItem = {
        questionNumber:
          session.questionNumber +
          1,

        day:
          currentMission.day,

        title:
          currentMission.title,

        question:
          session.currentQuestion,

        answer:
          message.trim(),

        evaluation: null
      };

      session.history.push(
        historyItem
      );

      const evaluation =
        await evaluateAnswer(
          session,
          message.trim()
        );

      historyItem.evaluation =
        evaluation;

      updateInterviewState(
        session,
        evaluation,
        currentMission
      );

      session.questionNumber++;

      /*
        INTERVIEW FINISHED
      */

      if (
        session.questionNumber >=
        TOTAL_QUESTIONS
      ) {
        session.feedback =
          await generateFinalFeedback(
            session
          );

        session.finished =
          true;

        return res.json({
          reply:
            "Interview completed. Here is your personalized feedback.",

          done: true,

          feedback:
            session.feedback,

          evaluation,

          interviewState:
            serializableState(
              session
                .interviewState
            )
        });
      }

      /*
        NEXT QUESTION
      */

      const nextMission =
        session.plan[
          session.questionNumber
        ];

      session.currentQuestion =
        await generateInterviewQuestion(
          session,
          nextMission,
          message.trim()
        );

      let reason =
        "Maintaining intermediate difficulty while broadening curriculum coverage.";

      if (
        evaluation.score >= 8
      ) {
        reason =
          "Increasing difficulty because the previous answer was strong.";
      }

      if (
        evaluation.score < 6
      ) {
        reason =
          "Probing the candidate's weaker area before moving harder.";
      }

      return res.json({
        reply:
          session.currentQuestion,

        done: false,

        questionNumber:
          session.questionNumber +
          1,

        totalQuestions:
          TOTAL_QUESTIONS,

        day:
          nextMission.day,

        topic:
          nextMission.title,

        evaluation,

        difficulty:
          session
            .interviewState
            .difficulty,

        reason,

        interviewState:
          serializableState(
            session
              .interviewState
          )
      });
    } catch (error) {
      console.error(
        "Interview endpoint error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to process interview turn.",

        details:
          error.message
      });
    }
  }
);

/* ---------------- SERVER ---------------- */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `AI Interview Agent backend running at http://localhost:${PORT}`
  );

  console.log(
    `Required endpoint: POST http://localhost:${PORT}/api/interview`
  );
});