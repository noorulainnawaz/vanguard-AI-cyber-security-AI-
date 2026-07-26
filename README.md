# Vanguard AI

**AI-Powered Cybersecurity Risk & Decision Platform**

---

## a. What This App Does & The Problem It Solves

Most individuals and small organizations have no easy, affordable way to understand their real cybersecurity exposure. Professional security audits are expensive and slow, and generic advice found online doesn't account for a specific person's or company's actual situation.

**Vanguard AI** solves this by giving anyone — a student, a small business owner, an employee, a security team — an instant, AI-driven cybersecurity assessment. Users answer a few simple questions about their digital habits (passwords, 2FA, phishing awareness, company security posture, etc.) and the platform's AI engine scores their risk, explains *why*, and generates personalized, actionable recommendations — the kind of insight that would normally require hiring a security consultant.

It also includes an AI-generated attack-story simulator and a cybersecurity learning-lab generator, so users can *learn* about threats (ransomware, phishing, SQL injection, etc.) in plain language, not just get scored on them. A separate, hidden admin console lets an operator monitor all users, organizations, and platform activity — including per-user activity and direct messaging.

**Who it's for:** individuals who want to understand their personal digital risk, small-to-medium businesses without a dedicated security team, students learning cybersecurity concepts, and platform operators/admins who need visibility and control over the whole system.

---

## b. Live Deployed URL

🔗 **Use the live app here:** https://vanguard-ai-frontend.vercel.app

🔗 **Backend API (interactive docs):** https://vanguard-ai.fastapicloud.dev/docs

---

## c. Features List

### Core Platform
- **Landing page** with feature overview, "how it works," and about sections
- **Register / Login** — email + password, plus **"Sign in with Google"** (OAuth)
- **Forgot Password** flow
- **User Authentication** — JWT-based sessions, bcrypt password hashing

### AI-Powered Security Modules
- **AI Chat Assistant** — conversational cybersecurity Q&A with context memory (remembers prior messages in a session), plus **voice input (microphone)** and **voice output (text-to-speech)**
- **Digital Identity Risk Scoring** — score based on 2FA usage, password reuse, breach exposure, brand impersonation, username lookalikes, and social engineering exposure
- **Human Risk Engine** — phishing awareness, password hygiene, and security maturity scoring
- **Insider Threat Predictor** — detects suspicious behavior patterns (after-hours logins, bulk downloads, USB usage, unauthorized file access) and builds a timeline
- **AI Attack Story Generator** — generates a realistic, stage-by-stage attack scenario (phishing, ransomware, credential theft, business email compromise) with lessons learned
- **AI Cyber Lab Generator** — turns any topic (SQL Injection, XSS, Cryptography, OWASP, etc.) into a structured learning module with objectives, explanation, hands-on exercise, and quiz
- **AI Security Decision Engine (CISO simulator)** — given a company's industry, size, budget, and current tools, generates a prioritized security roadmap with implementation phases and budget allocation
- **Attack Surface Visualizer** — maps an organization's digital assets, exposure levels, and security layers into a risk heatmap
- **File Analysis** — upload a log/config/code file and the AI flags security issues, misconfigurations, and exposed secrets
- **Mission Control Dashboard** — aggregates all risk scores, recent AI decisions, and a unified security timeline for an organization, with chart-based visual comparisons
- **AI Executive Report Generator + PDF Export** — produces a professional PDF security report summarizing all findings
- **Profile page**

### Admin Console (fully separate from the normal user system)
The admin console (`/system-access-portal`) is a completely isolated authentication system — intentionally **not linked anywhere** in the normal UI. It uses its own isolated `admins` database table and its own login endpoint, entirely separate from regular user login. Normal user accounts cannot access it, and admin credentials cannot log into the normal app.

- Platform-wide statistics (total users, organizations, reports, average risk scores)
- Full user management table (promote/demote/delete users)
- Organization overview
- **Per-user activity viewer** — see any user's chat history and full risk assessment history
- **Direct admin-to-user messaging** — send a message/notification straight to any user, which appears as a notification for them

---

## d. The AI Feature — What It Does & The Prompts Behind It

Every AI-driven module calls **Google's Gemini API** (`gemini-2.5-flash`) with a custom, purpose-built prompt for that specific feature — not a single generic "chatbot" prompt reused everywhere. The frontend sends the user's actual form inputs to the backend, which builds the prompt dynamically, calls Gemini, parses the (often strict-JSON) response, and returns it to the UI to render as cards, charts, and timelines.

**AI Chat Assistant (with context memory)** — the last 10 messages in a session are pulled from the database and injected into the prompt so the AI remembers the conversation:
```
You are Vanguard AI, a professional cybersecurity assistant. Continue this
conversation naturally, remembering what was said before.

Conversation so far:
{last 10 messages from this session}
Vanguard AI:
```

**Digital Identity Risk recommendations:**
```
You are a cybersecurity risk advisor. A user has a digital identity risk score of
{score}/100 (Risk Level: {risk_level}). Risk factors found: {factors}.
Email Exposure Risk: {email_exposure_score}/100. Social Engineering Risk: {social_engineering_score}/100.
Give 3 short, professional, actionable recommendations to reduce this risk.
```

**AI Attack Story Generator** (forces structured JSON output — title, summary, 5-stage timeline, lessons learned):
```
You are a cybersecurity storytelling engine. Create a realistic {attack_type} attack
scenario for a {company_size} company in the {industry} industry.
Respond ONLY in this exact JSON format... (title, summary, timeline, lessons_learned)
```

**AI Cyber Lab Generator** (forces structured JSON — learning path, objectives, explanation, hands-on exercise, expected outcome, quiz, recommendations):
```
You are a cybersecurity training content creator. Create a structured learning
module on the topic "{topic}" for {difficulty} level learners.
Respond ONLY in this exact JSON format... (title, learning_path, objectives,
explanation, hands_on_exercise, expected_outcome, quiz, recommendations)
```

**AI Security Decision Engine (CISO simulator):**
```
You are acting as a Chief Information Security Officer (CISO) advisor. A {company_size}
company in the {industry} industry with {number_of_employees} employees currently uses
these security tools: {current_tools}. Their current security level is "{current_security_level}"...
Generate a prioritized security roadmap... (recommendations, implementation_phases,
budget_allocation, security_architecture_suggestions)
```

Each prompt is engineered to (1) give the AI just enough structured context from the user's actual input/scores, and (2) force a specific, parseable output format — plain text for conversational answers, strict JSON for structured features like attack stories, cyber labs, and roadmaps — so results can be stored and displayed reliably in the UI.

---

## e. Tools, Services & Models Used

**Frontend**
- React + Vite + Tailwind CSS v4 + React Router
- Recharts (charts)
- Browser Web Speech API (SpeechRecognition + SpeechSynthesis) for voice input/output
- JWT-based session (stored in `localStorage`) + Google Identity Services (OAuth)
- Hosting: Vercel

**Backend**
- Python + FastAPI
- JWT (python-jose) + bcrypt password hashing (passlib) + Google OAuth
- ReportLab (PDF generation)
- Hosting: FastAPI Cloud

**Shared**
- **AI Model/Provider:** Google Gemini API (`gemini-2.5-flash`) — free tier
- **Database:** Supabase (managed PostgreSQL)
- **Editor:** Antigravity (VS Code-based)

---

## f. Screenshots

*(Add 4+ screenshots below — Landing page, Login/Register with Google button, Dashboard with charts, and the Admin Console overview/user management)*

![Screenshot 1 - Landing Page](screenshots/screenshot1.png)
![Screenshot 2 - Login/Register](screenshots/screenshot2.png)
![Screenshot 3 - Dashboard](screenshots/screenshot3.png)
![Screenshot 4 - Admin Console](screenshots/screenshot4.png)

---

## g. How to Run This Project Locally

This project has two parts — a **backend** (FastAPI) and a **frontend** (React) — both need to be running at the same time for the app to work locally.

### Backend
1. Clone the backend repository
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the project root with:
   ```
   DATABASE_URL=<your Supabase pooler connection string>
   DIRECT_URL=<your Supabase direct connection string>
   JWT_SECRET_KEY=<any long random string>
   GEMINI_API_KEY=<your free Google AI Studio API key>
   GOOGLE_CLIENT_ID=<your Google OAuth Client ID>
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
5. Open `http://127.0.0.1:8000/docs` to explore and test the API.

### Frontend
1. Clone the frontend repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. The API URL is configured directly in each page's `API_URL` constant, currently pointing to the live backend (`https://vanguard-ai.fastapicloud.dev`). To point to a local backend instead, change these to `http://127.0.0.1:8000`.
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## 🔐 A Note on the Admin Console

The admin console (`/system-access-portal`) is intentionally not linked anywhere in the normal UI and uses a completely separate login/table from regular users. For security, live admin credentials are not published in this document. See the Screenshots section above for the admin console in action (stats overview, user management, and per-user activity monitoring).<img width="953" height="435" alt="Screenshot 2026-07-26 212417" src="https://github.com/user-attachments/assets/a5d3f7f1-1164-450b-b4da-ce2ad8d84fec" />
<img width="959" height="441" alt="Screenshot 2026-07-26 212408" src="https://github.com/user-attachments/assets/40df20a2-7054-4df6-8032-2a791635b069" />
<img width="959" height="480" alt="Screenshot 2026-07-26 212401" src="https://github.com/user-attachments/assets/edf8ba29-b60e-4fc0-ae0b-76c00619c4a6" />
<img width="323" height="143" alt="Screenshot 2026-07-26 182647" src="https://github.com/user-attachments/assets/615a5e13-daa0-4912-839b-f73eb3e9d009" />
<img width="959" height="370" alt="Screenshot 2026-07-26 182618" src="https://github.com/user-attachments/assets/0daa063b-c826-4b88-9c5c-8916472a20b1" />
<img width="959" height="444" alt="Screenshot 2026-07-26 182547" src="https://github.com/user-attachments/assets/bc8ca95a-d6a9-4361-8ec9-0b8564a090b5" />
<img width="386" height="206" alt="Screenshot 2026-07-26 182326" src="https://github.com/user-attachments/assets/3c1456fd-5d59-49bf-9ebe-69fd26f53dc1" />
<img width="412" height="439" alt="Screenshot 2026-07-26 182301" src="https://github.com/user-attachments/assets/9ebed74d-62b8-4fc3-b703-b94ac14e37f7" />
<img width="959" height="443" alt="Screenshot 2026-07-26 182155" src="https://github.com/user-attachments/assets/da842ec5-e733-4fdb-b19e-26a9cc668c94" />
<img width="170" height="203" alt="Screenshot 2026-07-26 182059" src="https://github.com/user-attachments/assets/f6b64a09-14e0-43d0-9b80-e35c1edcc34a" />
<img width="171" height="207" alt="Screenshot 2026-07-26 182008" src="https://github.com/user-attachments/assets/81436f5d-53ce-4179-9254-4c66b4d2b1b4" />
<img width="175" height="414" alt="Screenshot 2026-07-26 181913" src="https://github.com/user-attachments/assets/40d49787-6bbf-4331-a0b6-8850bd5fbfee" />
<img width="153" height="347" alt="Screenshot 2026-07-26 163051" src="https://github.com/user-attachments/assets/9514dede-29f0-433a-8dff-0b3690465a0f" />
