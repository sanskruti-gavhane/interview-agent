import { useEffect, useRef, useState } from "react";
import "./App.css";

const API = "https://interview-agent-lwoi.onrender.com";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value ?? 0}/10</strong>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="bar">
      <span
        style={{
          width: `${Math.max(
            0,
            Math.min(100, value * 10)
          )}%`
        }}
      />
    </div>
  );
}

function App() {
  const [candidates, setCandidates] =
    useState([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [candidate, setCandidate] =
    useState(null);

  const [sessionId, setSessionId] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [questionNumber, setQuestionNumber] =
    useState(0);

  const [totalQuestions, setTotalQuestions] =
    useState(8);

  const [topic, setTopic] =
    useState("");

  const [day, setDay] =
    useState(null);

  const [difficulty, setDifficulty] =
    useState("intermediate");

  const [reason, setReason] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [feedback, setFeedback] =
    useState(null);

  const [interviewState, setInterviewState] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const recognitionRef =
    useRef(null);

  useEffect(() => {
    fetch(`${API}/api/candidates`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load candidates."
          );
        }

        return response.json();
      })
      .then(setCandidates)
      .catch((err) =>
        setError(err.message)
      );
  }, []);

  const selectedCandidate =
    candidates.find(
      (item) =>
        item.member.id === selectedId
    );

  const progress =
    questionNumber
      ? ((questionNumber - 1) /
          totalQuestions) *
        100
      : 0;

  const passedMissions =
    candidate?.missions?.filter(
      (mission) =>
        mission.passed &&
        !mission.skipped
    ) || [];

  const startInterview =
    async () => {
      if (!selectedCandidate) {
        setError(
          "Please select a candidate first."
        );

        return;
      }

      setLoading(true);
      setError("");
      setFeedback(null);
      setHistory([]);

      const newSessionId =
        crypto.randomUUID();

      try {
        const response =
          await fetch(
            `${API}/api/interview`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                sessionId:
                  newSessionId,

                candidate:
                  selectedCandidate
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not start interview."
          );
        }

        setCandidate(
          selectedCandidate
        );

        setSessionId(
          newSessionId
        );

        setQuestion(
          data.reply
        );

        setQuestionNumber(
          data.questionNumber
        );

        setTotalQuestions(
          data.totalQuestions || 8
        );

        setDay(data.day);

        setTopic(data.topic);

        setDifficulty(
          data.difficulty ||
            "intermediate"
        );

        setReason("");

        setInterviewState(
          null
        );

        setAnswer("");
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    };

  const submitAnswer =
    async () => {
      if (
        !answer.trim() ||
        !sessionId
      ) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API}/api/interview`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                sessionId,

                message:
                  answer.trim()
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not process answer."
          );
        }

        setHistory(
          (previous) => [
            ...previous,
            {
              questionNumber,

              question,

              answer:
                answer.trim(),

              day,

              topic,

              evaluation:
                data.evaluation ||
                null
            }
          ]
        );

        if (data.done) {
          setFeedback(
            data.feedback
          );

          setInterviewState(
            data.interviewState ||
              null
          );

          setQuestion("");
        } else {
          setQuestion(
            data.reply
          );

          setQuestionNumber(
            data.questionNumber
          );

          setDay(data.day);

          setTopic(
            data.topic
          );

          setDifficulty(
            data.difficulty ||
              "intermediate"
          );

          setReason(
            data.reason ||
              ""
          );

          setInterviewState(
            data.interviewState ||
              null
          );
        }

        setAnswer("");
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    };

  const startVoiceInput =
    () => {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          "Speech recognition is not supported. Use Chrome or Edge."
        );

        return;
      }

      if (isListening) {
        recognitionRef.current?.stop();

        setIsListening(false);

        return;
      }

      const recognition =
        new SpeechRecognition();

      recognition.lang =
        "en-IN";

      recognition.continuous =
        true;

      recognition.interimResults =
        true;

      recognitionRef.current =
        recognition;

      recognition.onstart =
        () =>
          setIsListening(
            true
          );

      recognition.onresult =
        (event) => {
          let finalText =
            "";

          for (
            let i =
              event.resultIndex;
            i <
            event.results.length;
            i++
          ) {
            if (
              event.results[i]
                .isFinal
            ) {
              finalText +=
                event.results[i][0]
                  .transcript;
            }
          }

          if (finalText) {
            setAnswer(
              (previous) =>
                `${previous} ${finalText}`.trim()
            );
          }
        };

      recognition.onerror =
        () =>
          setIsListening(
            false
          );

      recognition.onend =
        () =>
          setIsListening(
            false
          );

      recognition.start();
    };

  const reset = () => {
    recognitionRef.current?.stop();

    setCandidate(null);

    setSelectedId("");

    setSessionId("");

    setQuestion("");

    setAnswer("");

    setHistory([]);

    setFeedback(null);

    setInterviewState(null);

    setQuestionNumber(0);

    setError("");
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          Interview
          <span>AI</span>
        </div>

        <div className="nav-status">
          31-Day AI Cohort ·
          Adaptive Interview Engine
        </div>
      </nav>

      <main className="page">

        {/* HERO */}

        <section className="hero">

          <div className="badge">
            🤖 Curriculum-aware ·
            Adaptive · Contextual
          </div>

          <h1>
            AI Cohort{" "}
            <span>
              Interview Agent
            </span>
          </h1>

          <p className="description">
            A realistic technical
            interviewer that uses
            each candidate's completed
            missions and learning
            journey to adapt difficulty
            and generate follow-ups.
          </p>

        </section>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* CANDIDATE SELECTION */}

        {!candidate &&
          !feedback && (
            <section className="card setup-card">

              <div className="section-heading">

                <div>
                  <p className="eyebrow">
                    STEP 1
                  </p>

                  <h2>
                    Select Candidate
                  </h2>
                </div>

                <span className="pill">
                  Synthetic hackathon
                  data
                </span>

              </div>

              <select
                className="candidate-select"
                value={selectedId}
                onChange={(event) =>
                  setSelectedId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Choose a candidate...
                </option>

                {candidates.map(
                  (item) => (
                    <option
                      key={
                        item.member.id
                      }
                      value={
                        item.member.id
                      }
                    >
                      {
                        item.member.name
                      }{" "}
                      —{" "}
                      {
                        item.member
                          .jobRole
                      }
                    </option>
                  )
                )}

              </select>

              {selectedCandidate && (
                <>
                  <div className="candidate-preview">

                    <div>
                      <strong>
                        {
                          selectedCandidate
                            .member.name
                        }
                      </strong>

                      <span>
                        {
                          selectedCandidate
                            .member.jobRole
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          selectedCandidate
                            .member
                            .yearsExperience
                        }
                      </strong>

                      <span>
                        years experience
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          selectedCandidate
                            .missions
                            .filter(
                              (m) =>
                                m.passed &&
                                !m.skipped
                            ).length
                        }
                      </strong>

                      <span>
                        passed missions
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          selectedCandidate
                            .signals
                            .commitDays
                        }
                      </strong>

                      <span>
                        commit days
                      </span>
                    </div>

                  </div>

                  <div className="journey-preview">

                    <div className="mini-title">
                      Learning journey
                      signals
                    </div>

                    <span>
                      Completed:{" "}
                      {
                        selectedCandidate
                          .signals
                          .missionsCompleted
                      }
                    </span>

                    <span>
                      First try:{" "}
                      {
                        selectedCandidate
                          .signals
                          .missionsFirstTry
                      }
                    </span>

                    <span>
                      Eligible topics:{" "}
                      {
                        selectedCandidate
                          .missions
                          .filter(
                            (m) =>
                              m.passed &&
                              !m.skipped
                          ).length
                      }
                    </span>

                  </div>
                </>
              )}

              <button
                className="primary-btn"
                onClick={
                  startInterview
                }
                disabled={
                  loading ||
                  !selectedCandidate
                }
              >
                {loading
                  ? "Preparing adaptive interview..."
                  : "Start AI Interview →"}
              </button>

              <p className="hint">
                The planner targets 8
                questions across at
                least 4 curriculum days.
              </p>

            </section>
          )}

        {/* INTERVIEW */}

        {candidate &&
          !feedback && (
            <section className="interview-layout">

              {/* SIDEBAR */}

              <aside className="card profile-card">

                <p className="eyebrow">
                  CANDIDATE
                </p>

                <h2>
                  {
                    candidate.member.name
                  }
                </h2>

                <p className="role">
                  {
                    candidate.member
                      .jobRole
                  }
                </p>

                <div className="profile-stats">

                  <span>
                    <b>
                      {
                        candidate
                          .member
                          .yearsExperience
                      }
                    </b>

                    yrs
                  </span>

                  <span>
                    <b>
                      {
                        candidate
                          .signals
                          .commitDays
                      }
                    </b>

                    commit days
                  </span>

                </div>

                {/* INTELLIGENCE */}

                <div className="intelligence-box">

                  <div className="section-heading">

                    <h3>
                      Interview
                      Intelligence
                    </h3>

                    <span className="live-dot">
                      LIVE
                    </span>

                  </div>

                  <div className="stat-line">

                    <span>
                      Progress
                    </span>

                    <b>
                      {questionNumber}/
                      {totalQuestions}
                    </b>

                  </div>

                  <ProgressBar
                    value={
                      questionNumber /
                      totalQuestions
                    }
                  />

                  <div className="stat-line">

                    <span>
                      Difficulty
                    </span>

                    <b className="capitalize">
                      {
                        difficulty
                      }
                    </b>

                  </div>

                  {interviewState && (
                    <div className="stat-line">

                      <span>
                        Last score
                      </span>

                      <b>
                        {
                          interviewState
                            .lastScore
                        }
                        /10
                      </b>

                    </div>
                  )}

                </div>

                <h3>
                  Learning Journey
                </h3>

                <div className="topic-list">

                  {passedMissions.map(
                    (mission) => {

                      const asked =
                        history.some(
                          (item) =>
                            item.day ===
                            mission.day
                        );

                      return (
                        <div
                          className={`topic-done ${
                            asked
                              ? "asked"
                              : ""
                          }`}
                          key={
                            mission.day
                          }
                        >

                          <span>
                            {asked
                              ? "✓"
                              : "○"}{" "}
                            Day{" "}
                            {
                              mission.day
                            }
                          </span>

                          <small>
                            {
                              mission.title
                            }
                          </small>

                        </div>
                      );
                    }
                  )}

                </div>

                <button
                  className="secondary-btn"
                  onClick={reset}
                >
                  End / Restart
                </button>

              </aside>

              {/* MAIN INTERVIEW */}

              <section className="card interview-card">

                <div className="interview-header">

                  <div>

                    <p className="eyebrow">
                      QUESTION{" "}
                      {
                        questionNumber
                      }{" "}
                      OF{" "}
                      {
                        totalQuestions
                      }
                    </p>

                    <span className="topic-label">
                      Day {day} ·{" "}
                      {topic}
                    </span>

                  </div>

                  <div className="progress">

                    <span
                      style={{
                        width: `${progress}%`
                      }}
                    />

                  </div>

                </div>

                <div className="question-card">

                  <div className="question-meta">

                    <span>
                      AI Interviewer asks
                    </span>

                    <span className="difficulty-badge">
                      {
                        difficulty
                      }
                    </span>

                  </div>

                  <h2>
                    {question}
                  </h2>

                </div>

                {reason && (
                  <div className="decision-card">

                    <strong>
                      🎯 Interview strategy
                    </strong>

                    <span>
                      {reason}
                    </span>

                  </div>
                )}

                <label className="answer-label">
                  Your answer
                </label>

                <button
                  type="button"
                  className={`voice-input-btn ${
                    isListening
                      ? "listening"
                      : ""
                  }`}
                  onClick={
                    startVoiceInput
                  }
                  disabled={loading}
                >
                  {isListening
                    ? "⏹ Stop listening"
                    : "🎙️ Speak answer"}
                </button>

                <textarea
                  className="answer-box"
                  value={answer}
                  onChange={(event) =>
                    setAnswer(
                      event.target.value
                    )
                  }
                  placeholder="Explain your reasoning, implementation choices, trade-offs, or examples..."
                  disabled={loading}
                />

                <button
                  className="primary-btn submit-btn"
                  onClick={
                    submitAnswer
                  }
                  disabled={
                    loading ||
                    !answer.trim()
                  }
                >
                  {loading
                    ? "AI is evaluating..."
                    : "Submit Answer →"}
                </button>

                {/* HISTORY */}

                {history.length >
                  0 && (
                  <div className="history">

                    <h3>
                      Interview history
                    </h3>

                    {history.map(
                      (item) => (
                        <div
                          className="history-item"
                          key={
                            item.questionNumber
                          }
                        >

                          <div className="history-top">

                            <b>
                              Q
                              {
                                item.questionNumber
                              }{" "}
                              · Day{" "}
                              {item.day}
                            </b>

                            {item.evaluation && (
                              <span className="score">
                                {
                                  item
                                    .evaluation
                                    .score
                                }
                                /10
                              </span>
                            )}

                          </div>

                          <p>
                            {
                              item.question
                            }
                          </p>

                          {item.evaluation && (
                            <div className="evaluation-row">

                              <span>
                                Technical{" "}
                                {
                                  item
                                    .evaluation
                                    .technicalCorrectness
                                }
                                /10
                              </span>

                              <span>
                                Depth{" "}
                                {
                                  item
                                    .evaluation
                                    .depth
                                }
                                /10
                              </span>

                              <span>
                                Reasoning{" "}
                                {
                                  item
                                    .evaluation
                                    .reasoning
                                }
                                /10
                              </span>

                            </div>
                          )}

                        </div>
                      )
                    )}

                  </div>
                )}

              </section>

            </section>
          )}

        {/* FINAL FEEDBACK */}

        {feedback && (
          <section className="card feedback-card">

            <div className="feedback-hero">

              <div className="badge">
                🎯 Interview Complete
              </div>

              <h2>
                Your Technical
                Interview Report
              </h2>

              <p>
                {feedback.summary}
              </p>

            </div>

            <div className="scorecard">

              <h3>
                Competency Scorecard
              </h3>

              <div className="metrics-grid">

                <Metric
                  label="Overall"
                  value={
                    feedback
                      .scorecard
                      ?.overall
                  }
                />

                <Metric
                  label="Technical"
                  value={
                    feedback
                      .scorecard
                      ?.technical
                  }
                />

                <Metric
                  label="Depth"
                  value={
                    feedback
                      .scorecard
                      ?.depth
                  }
                />

                <Metric
                  label="Reasoning"
                  value={
                    feedback
                      .scorecard
                      ?.reasoning
                  }
                />

                <Metric
                  label="Clarity"
                  value={
                    feedback
                      .scorecard
                      ?.clarity
                  }
                />

              </div>

            </div>

            <div className="coverage-box">

              <h3>
                Curriculum Coverage
              </h3>

              <div className="coverage-list">

                {(
                  feedback.coveredDays ||
                  []
                ).map(
                  (coveredDay) => {

                    const mission =
                      candidate.missions.find(
                        (item) =>
                          item.day ===
                          coveredDay
                      );

                    return (
                      <span
                        key={
                          coveredDay
                        }
                      >
                        ✓ Day{" "}
                        {coveredDay} ·{" "}
                        {
                          mission?.title ||
                          "Curriculum topic"
                        }
                      </span>
                    );
                  }
                )}

              </div>

            </div>

            <div className="feedback-grid">

              <div>

                <h3>
                  💪 Strengths
                </h3>

                <ul>
                  {feedback.strengths.map(
                    (item, index) => (
                      <li
                        key={index}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

              <div>

                <h3>
                  🔍 Gaps
                </h3>

                <ul>
                  {feedback.gaps.map(
                    (item, index) => (
                      <li
                        key={index}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

              <div>

                <h3>
                  🚀 Next Steps
                </h3>

                <ul>
                  {feedback.next.map(
                    (item, index) => (
                      <li
                        key={index}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>

            </div>

            <button
              className="primary-btn"
              onClick={reset}
            >
              Start Another Interview
            </button>

          </section>
        )}

      </main>
    </div>
  );
}

export default App;