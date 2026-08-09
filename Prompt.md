# Prompt.md --- AI Interviewer Website

> This file is a consolidated/reconstructed set of prompts for building
> the AI Interviewer website discussed in this project.\
> It combines the requirements for the frontend, backend, Gemini
> integration, adaptive interview logic, deployment, UI styling,
> branding, debugging, and final polishing.

------------------------------------------------------------------------

## Prompt 1 --- Build the complete AI Interviewer project

Create a full-stack **AI Interviewer / AI Interview Agent** web
application for a hackathon project.

### Goal

Build a realistic technical interview platform that: - Selects a
candidate from synthetic cohort data. - Uses the candidate's completed
learning missions and journey signals. - Generates adaptive technical
interview questions. - Evaluates candidate answers using Gemini. -
Changes difficulty based on performance. - Generates follow-up
questions. - Covers multiple curriculum days/topics. - Produces a final
technical interview report.

### Technology

Use: - Frontend: React + Vite - Backend: Node.js + Express - AI: Google
Gemini API - Deployment: Render - Communication: REST API using JSON

Keep the frontend and backend separate.

------------------------------------------------------------------------

## Prompt 2 --- Create the backend

Create a Node.js + Express backend for the AI Interviewer.

### Backend requirements

Implement: - Express server - CORS - dotenv - Gemini API integration -
Candidate data - Interview session management - Adaptive interview
planner - Answer evaluation - Final feedback generation

### Required endpoints

#### GET

`/api/candidates`

Return candidate data containing: - member - missions - signals

#### POST

`/api/interview`

Support: 1. Starting an interview 2. Submitting an answer 3. Returning
the next adaptive question 4. Evaluating the previous answer 5. Ending
the interview 6. Returning the final feedback

#### GET

`/api/test-gemini`

Return a simple Gemini connection test response.

Use an environment variable:

`GEMINI_API_KEY`

Do not hard-code the API key.

------------------------------------------------------------------------

## Prompt 3 --- Gemini integration

Integrate Google Gemini into the backend.

Use the Gemini SDK and load the API key from `.env`.

The backend should: - Generate interview questions. - Evaluate technical
answers. - Score technical correctness. - Score depth. - Score
reasoning. - Score clarity. - Decide whether the next question should be
easier, similar, or harder. - Generate contextual follow-up questions. -
Generate the final interview summary.

Return structured JSON whenever possible.

Example evaluation structure:

``` json
{
  "score": 8,
  "technicalCorrectness": 8,
  "depth": 7,
  "reasoning": 8,
  "clarity": 9,
  "strengths": ["..."],
  "gaps": ["..."],
  "feedback": "..."
}
```

------------------------------------------------------------------------

## Prompt 4 --- Candidate and curriculum data

Create synthetic hackathon candidate data.

Each candidate should contain:

### Member information

-   id
-   name
-   jobRole
-   yearsExperience

### Learning signals

-   missionsCompleted
-   missionsFirstTry
-   commitDays

### Missions

Each mission should include: - day - title - passed - skipped -
topic/technical area

The interview planner should only use eligible/passed missions where
appropriate.

------------------------------------------------------------------------

## Prompt 5 --- Adaptive interview planner

Create an adaptive interview system.

The interview should contain approximately **8 questions** and target at
least **4 curriculum days**.

The planner should consider: - Candidate experience - Completed
missions - Learning journey - Previous answers - Previous scores -
Current difficulty - Topics already covered

Difficulty levels: - beginner - intermediate - advanced

Rules: - Strong answers should increase difficulty. - Weak answers
should reduce or maintain difficulty. - Good answers can trigger deeper
follow-ups. - Questions should be related to the candidate's curriculum
journey. - Avoid repeatedly asking the same topic unless a follow-up is
intentional.

Return: - question - questionNumber - totalQuestions - day - topic -
difficulty - reason

------------------------------------------------------------------------

## Prompt 6 --- Interview API behavior

For the first POST request:

``` json
{
  "sessionId": "unique-session-id",
  "candidate": {}
}
```

Return:

``` json
{
  "reply": "Interview question",
  "questionNumber": 1,
  "totalQuestions": 8,
  "day": 1,
  "topic": "Topic",
  "difficulty": "intermediate"
}
```

For answer submission:

``` json
{
  "sessionId": "unique-session-id",
  "message": "Candidate answer"
}
```

Return either: - evaluation + next question, or - final feedback if the
interview is complete.

Example:

``` json
{
  "done": false,
  "reply": "Next question",
  "questionNumber": 2,
  "day": 2,
  "topic": "Another topic",
  "difficulty": "advanced",
  "reason": "The previous answer demonstrated strong understanding."
}
```

At the end:

``` json
{
  "done": true,
  "feedback": {
    "summary": "...",
    "scorecard": {
      "overall": 8,
      "technical": 8,
      "depth": 7,
      "reasoning": 8,
      "clarity": 9
    },
    "coveredDays": [1, 2, 4, 6],
    "strengths": [],
    "gaps": [],
    "next": []
  }
}
```

------------------------------------------------------------------------

## Prompt 7 --- Build the React frontend

Create a React + Vite frontend for the AI Interviewer.

The frontend must: - Load candidates from `/api/candidates`. - Allow
candidate selection. - Show candidate information. - Start an
interview. - Display AI-generated questions. - Accept typed answers. -
Support speech-to-text. - Submit answers. - Show interview progress. -
Show difficulty. - Show learning journey. - Show interview history. -
Show evaluation scores. - Show final feedback.

Use a reusable API base URL:

``` js
const API = "BACKEND_URL";
```

Do not hard-code localhost in the deployed frontend.

------------------------------------------------------------------------

## Prompt 8 --- Candidate selection UI

Create a candidate selection card.

Display: - Candidate name - Job role - Years of experience - Passed
missions - Commit days - Learning journey signals

Add:

`Start AI Interview →`

The button should be disabled until a candidate is selected.

Show a useful loading message while the interview is being prepared.

------------------------------------------------------------------------

## Prompt 9 --- Interview screen

Create a two-column interview layout.

### Left sidebar

Show: - Candidate name - Job role - Experience - Commit days - Interview
Intelligence - Progress - Difficulty - Last score - Learning Journey -
Completed curriculum days - End / Restart button

### Main panel

Show: - Question number - Total questions - Day - Topic - Difficulty -
AI Interviewer asks - Current question - Strategy/reason information -
Answer textarea - Voice input button - Submit Answer button - Interview
history

------------------------------------------------------------------------

## Prompt 10 --- Speech-to-text

Add browser speech recognition.

Use:

``` js
window.SpeechRecognition ||
window.webkitSpeechRecognition
```

Use: - `en-IN` - continuous recognition - interim results

Allow the user to: - Start speaking - Stop listening - Append recognized
text to the answer textarea

If speech recognition is unsupported, display:

"Speech recognition is not supported. Use Chrome or Edge."

------------------------------------------------------------------------

## Prompt 11 --- Final interview report

After the final question, display a report.

Include:

### Header

"Interview Complete"

### Summary

Show the AI-generated interview summary.

### Competency Scorecard

Display: - Overall - Technical - Depth - Reasoning - Clarity

Each score should be shown as `/10`.

### Curriculum Coverage

Display covered days and their mission/topic titles.

### Strengths

Display a list.

### Gaps

Display a list.

### Next Steps

Display a list.

Add:

`Start Another Interview`

------------------------------------------------------------------------

## Prompt 12 --- Create App.css

Create a polished, modern AI interview dashboard.

Design requirements: - Dark professional background - Modern cards -
Rounded corners - Subtle borders - Good spacing - Responsive layout -
Clear hierarchy - Professional typography - Accessible buttons -
Progress bars - Status badges - Good mobile behavior

### Important text requirement

**All website text must be light-colored and readable on the dark
background.**

This includes: - Interview questions - Candidate names - Candidate job
roles - Labels - Topic names - Answer area text - Interview history -
Feedback - Strengths - Gaps - Next steps - Buttons where appropriate -
Placeholder text should also have sufficient contrast

Do not leave important text in dark/black colors on dark cards.

------------------------------------------------------------------------

## Prompt 13 --- Navbar branding

Change the top-left website branding.

Do NOT display:

`InterviewAI`

Display:

`AIinterviewer`

The desired navbar structure is:

``` jsx
<nav className="nav">
  <div className="brand">
    AIinterviewer
  </div>

  <div className="nav-status">
    31-Day AI Cohort · Adaptive Interview Engine
  </div>
</nav>
```

Make `AIinterviewer` visually prominent.

------------------------------------------------------------------------

## Prompt 14 --- Website title

Change the browser tab title from any old InterviewAI branding to:

`AIinterviewer`

In Vite/React, update the title in:

`index.html`

Example:

``` html
<title>AIinterviewer</title>
```

If a favicon or metadata contains the old branding, update those too.

------------------------------------------------------------------------

## Prompt 15 --- Frontend API URL

The frontend should not use:

``` js
const API = "https://your-backend-url.com";
```

Replace it with the actual deployed Render backend URL.

For example:

``` js
const API = "https://interview-agent-lwoi.onrender.com";
```

Use the actual backend URL generated by Render for the project.

Keep API calls like:

``` js
fetch(`${API}/api/candidates`)
```

and:

``` js
fetch(`${API}/api/interview`)
```

------------------------------------------------------------------------

## Prompt 16 --- Deploy backend on Render

Deploy the Node.js backend to Render.

### Steps

1.  Push the backend project to GitHub.
2.  Open Render.
3.  Create a new Web Service.
4.  Connect the GitHub repository.
5.  Select the backend directory if using a monorepo.
6.  Configure the build command.
7.  Configure the start command.
8.  Add environment variables.
9.  Deploy.
10. Copy the generated Render URL.

### Required environment variable

``` text
GEMINI_API_KEY=your_actual_gemini_key
```

Never commit `.env` to GitHub.

------------------------------------------------------------------------

## Prompt 17 --- Render backend configuration

Ensure the Express server listens on Render's assigned port.

Use:

``` js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `AI Interview Agent backend running at http://localhost:${PORT}`
  );

  console.log(
    `Required endpoint: POST http://localhost:${PORT}/api/interview`
  );
});
```

Do not force the backend to listen only on a fixed local port.

------------------------------------------------------------------------

## Prompt 18 --- Test Gemini

Add a test endpoint:

``` text
GET /api/test-gemini
```

It should return something similar to:

``` json
{
  "success": true,
  "response": "Gemini connection successful"
}
```

Test locally before deployment.

Example:

``` powershell
curl http://localhost:5000/api/test-gemini
```

After deployment, test:

``` text
https://YOUR-RENDER-BACKEND-URL/api/test-gemini
```

------------------------------------------------------------------------

## Prompt 19 --- Fix CORS

Configure backend CORS so the deployed React frontend can communicate
with the Render backend.

During development, allow the local frontend.

For deployment, allow the actual frontend domain.

Make sure these requests work: - GET `/api/candidates` - POST
`/api/interview` - GET `/api/test-gemini`

------------------------------------------------------------------------

## Prompt 20 --- Debug frontend/backend connection

If the frontend shows: - Failed to fetch - Could not load candidates -
Could not start interview - Could not process answer

Check:

1.  Backend is running.
2.  Render deployment is healthy.
3.  API URL is correct.
4.  `/api/candidates` works.
5.  `/api/test-gemini` works.
6.  CORS is configured.
7.  Frontend does not still point to localhost.
8.  Backend environment variables exist.
9.  Gemini API key is valid.
10. Browser console has no JavaScript errors.

------------------------------------------------------------------------

## Prompt 21 --- Fix port conflicts locally

If Node reports:

``` text
EADDRINUSE: address already in use :::3000
```

Find the process using the port and stop it, or use another port.

On Windows PowerShell:

``` powershell
netstat -ano | findstr :3000
```

Then terminate the relevant process:

``` powershell
taskkill /PID PROCESS_ID /F
```

Alternatively configure:

``` js
const PORT = process.env.PORT || 5000;
```

------------------------------------------------------------------------

## Prompt 22 --- Fix Gemini 429 errors

If Gemini returns HTTP 429: - Check API quota. - Avoid excessive
repeated requests during testing. - Add proper error handling. - Do not
retry indefinitely. - Return a user-friendly error. - Consider reducing
unnecessary Gemini calls.

Example backend behavior:

``` js
try {
  // Gemini request
} catch (error) {
  console.error(error);

  return res.status(500).json({
    error: "AI service temporarily unavailable."
  });
}
```

Do not expose the Gemini API key to the frontend.

------------------------------------------------------------------------

## Prompt 23 --- Environment variables

Create `.env.example`:

``` text
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Create `.gitignore` containing:

``` text
node_modules
.env
dist
```

Never commit:

``` text
.env
```

to GitHub.

------------------------------------------------------------------------

## Prompt 24 --- Production-ready API configuration

For the frontend, preferably support environment variables.

Example:

``` js
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
```

For local development:

``` text
VITE_API_URL=http://localhost:5000
```

For production:

``` text
VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com
```

This avoids editing source code whenever the backend URL changes.

------------------------------------------------------------------------

## Prompt 25 --- Rename the website everywhere

Search the entire project for:

``` text
InterviewAI
```

Replace the visible branding with:

``` text
AIinterviewer
```

Check: - `App.jsx` - `index.html` - `App.css` - README -
favicon/metadata - navbar - page title - deployment configuration - any
logo text

Do not change API routes or variable names unnecessarily if they are
unrelated to visible branding.

------------------------------------------------------------------------

## Prompt 26 --- Final code quality requirements

Before considering the project complete:

-   Remove broken JSX.
-   Remove accidental Markdown formatting from JavaScript.
-   Ensure all imports are valid.
-   Ensure every JSX element is correctly closed.
-   Ensure API calls use the correct backend URL.
-   Ensure `crypto.randomUUID()` is supported or provide a fallback if
    required.
-   Handle loading states.
-   Handle API errors.
-   Handle empty candidate data.
-   Handle missing feedback arrays safely.
-   Make the layout responsive.
-   Keep all important text readable.
-   Keep API keys server-side.
-   Test the full interview flow from start to final report.

------------------------------------------------------------------------

## Prompt 27 --- Final testing checklist

### Backend

-   [ ] Server starts successfully.
-   [ ] `/api/candidates` returns data.
-   [ ] `/api/test-gemini` returns success.
-   [ ] `/api/interview` starts an interview.
-   [ ] `/api/interview` evaluates answers.
-   [ ] Final feedback is returned.
-   [ ] Gemini API key is loaded from environment variables.
-   [ ] CORS works.

### Frontend

-   [ ] Candidate list loads.
-   [ ] Candidate can be selected.
-   [ ] Interview starts.
-   [ ] Question displays correctly.
-   [ ] Answer textarea works.
-   [ ] Voice input works in supported browsers.
-   [ ] Answer submission works.
-   [ ] Progress updates.
-   [ ] Difficulty updates.
-   [ ] History displays.
-   [ ] Final report displays.
-   [ ] Restart works.

### UI

-   [ ] Navbar says `AIinterviewer`.
-   [ ] Browser title says `AIinterviewer`.
-   [ ] Interview questions are light-colored.
-   [ ] All important text is readable.
-   [ ] Buttons have good contrast.
-   [ ] Mobile layout works.
-   [ ] No horizontal overflow.

### Deployment

-   [ ] Backend deployed on Render.
-   [ ] Frontend deployed.
-   [ ] Production API URL configured.
-   [ ] Environment variables configured.
-   [ ] No API key is committed.
-   [ ] Production interview flow tested.

------------------------------------------------------------------------

## Prompt 28 --- Final request for complete code

When code is requested, provide complete copy-paste-ready files rather
than partial snippets.

For frontend, provide: - `src/App.jsx` - `src/App.css` -
`src/main.jsx` - `index.html`

For backend, provide: - `src/server.js` - required data/config files -
`package.json` - `.env.example`

Clearly state where every file should be placed.

Do not omit existing functionality while fixing styling, branding,
deployment, or API errors.

------------------------------------------------------------------------

## Prompt 29 --- Final visual polish

Make the website look like a professional AI recruiting/interview
product rather than a basic college project.

Use: - Strong hero section - Professional dashboard cards - Consistent
spacing - Subtle animations where appropriate - Clear progress
indicators - Professional scorecards - Good hover states - Clear
disabled/loading states - Responsive design

Keep the design clean and readable.

The brand should consistently be:

# AIinterviewer

------------------------------------------------------------------------

## Final Project Specification

The finished application should provide this complete flow:

``` text
Open website
      ↓
Select Candidate
      ↓
View Learning Journey
      ↓
Start AI Interview
      ↓
AI generates curriculum-aware question
      ↓
Candidate types or speaks answer
      ↓
Gemini evaluates answer
      ↓
Score + adaptive decision
      ↓
Next question
      ↓
Repeat for approximately 8 questions
      ↓
Cover at least 4 curriculum days
      ↓
Generate final report
      ↓
Show scorecard
      ↓
Show strengths
      ↓
Show gaps
      ↓
Show next steps
      ↓
Start another interview
```

### Final branding

**Website name:** `AIinterviewer`

### Core purpose

**An adaptive AI technical interviewer that uses a candidate's learning
journey to personalize interview questions, evaluate answers, adapt
difficulty, and produce a final competency report.**
