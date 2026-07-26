import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import requests
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

from database import get_db

app = FastAPI()

# ---------------------------
# CORS SETUP (allows React frontend on localhost:5173 to call this API)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "https://vanguard-ai-frontend.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# AUTH SETUP (must be defined before any endpoint uses verify_token)
# ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24   # 24 hours

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


bearer_scheme = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """Use as a dependency to protect routes: current_user = Depends(verify_token)"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload   # contains user_id, email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """Completely separate from normal user auth. Checks for an admin-issued JWT (has role=admin claim)."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return payload   # contains admin_id, email, role
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash"


def ask_ollama(prompt: str) -> str:
    """Calls Google Gemini API (free tier, no card required). Function name kept as 'ask_ollama'
    so none of the existing endpoint code below needs to change."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    response = requests.post(
        url,
        json={"contents": [{"parts": [{"text": prompt}]}]},
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "Sorry, the AI service did not return a valid response. Please try again."


@app.get("/")
def home():
    return {"message": "Vanguard AI Backend is running 🚀"}


# ---------------------------
# AI CHAT MODULE (with Context Memory)
# ---------------------------
@app.post("/chat")
def chat(message: str, session_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    db.execute(
        text("INSERT INTO chat_messages (session_id, sender, message) VALUES (:sid, 'user', :msg)"),
        {"sid": session_id, "msg": message}
    )
    db.commit()

    history_rows = db.execute(
        text("""SELECT sender, message FROM chat_messages
                WHERE session_id = :sid
                ORDER BY created_at DESC LIMIT 10"""),
        {"sid": session_id}
    ).fetchall()
    history_rows = list(reversed(history_rows))

    conversation_text = ""
    for sender, msg in history_rows:
        role = "User" if sender == "user" else "Vanguard AI"
        conversation_text += f"{role}: {msg}\n"

    ai_prompt = f"""You are Vanguard AI, a professional cybersecurity assistant. Continue this conversation naturally, remembering what was said before.

Conversation so far:
{conversation_text}
Vanguard AI:"""

    ai_reply = ask_ollama(ai_prompt)

    db.execute(
        text("INSERT INTO chat_messages (session_id, sender, message) VALUES (:sid, 'ai', :msg)"),
        {"sid": session_id, "msg": ai_reply}
    )
    db.commit()

    return {"reply": ai_reply}


@app.get("/chat/{session_id}/history")
def chat_history(session_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    rows = db.execute(
        text("""SELECT sender, message, created_at FROM chat_messages
                WHERE session_id = :sid ORDER BY created_at ASC"""),
        {"sid": session_id}
    ).fetchall()

    return {
        "session_id": session_id,
        "messages": [
            {"sender": r[0], "message": r[1], "created_at": r[2]} for r in rows
        ]
    }


# ---------------------------
# DIGITAL IDENTITY RISK MODULE
# (expanded: separate Email Exposure Risk + Social Engineering Risk sub-scores,
#  per spec: Digital Identity Score, Brand Impersonation Risk, Email Exposure Risk,
#  Username Similarity, Social Engineering Risk, AI Recommendations)
# ---------------------------
class IdentityRiskInput(BaseModel):
    user_id: int
    uses_2fa: bool
    password_reused: bool
    weak_password: bool
    public_email_exposed: bool
    old_password_days: int
    brand_impersonation_detected: bool
    similar_usernames_found: int
    # New fields for social engineering risk sub-score
    responded_to_unsolicited_requests: bool
    shares_personal_info_publicly: bool


@app.post("/identity-risk")
def identity_risk(data: IdentityRiskInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    # --- Overall Digital Identity Score (existing logic) ---
    score = 0
    factors = []

    if not data.uses_2fa:
        score += 20
        factors.append("2FA not enabled")
    if data.password_reused:
        score += 15
        factors.append("Password reused across accounts")
    if data.weak_password:
        score += 20
        factors.append("Weak password detected")
    if data.public_email_exposed:
        score += 10
        factors.append("Email exposed in public/breach data")
    if data.old_password_days > 180:
        score += 10
        factors.append("Password not changed in over 6 months")
    if data.brand_impersonation_detected:
        score += 15
        factors.append("Brand impersonation attempt detected (fake profiles/domains)")
    if data.similar_usernames_found > 2:
        score += 10
        factors.append(f"{data.similar_usernames_found} similar/lookalike usernames found online")

    if score <= 25:
        risk_level = "Low"
    elif score <= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # --- Sub-score: Email Exposure Risk (0-100, standalone) ---
    email_exposure_score = 0
    if data.public_email_exposed:
        email_exposure_score += 60
    if data.old_password_days > 180:
        email_exposure_score += 20
    email_exposure_score = min(email_exposure_score, 100)
    email_exposure_level = "Low" if email_exposure_score <= 25 else "Medium" if email_exposure_score <= 60 else "High"

    # --- Sub-score: Social Engineering Risk (0-100, standalone) ---
    social_engineering_score = 0
    se_factors = []
    if data.responded_to_unsolicited_requests:
        social_engineering_score += 40
        se_factors.append("Has responded to unsolicited requests for information")
    if data.shares_personal_info_publicly:
        social_engineering_score += 30
        se_factors.append("Shares personal information publicly on social media")
    if data.brand_impersonation_detected:
        social_engineering_score += 30
        se_factors.append("Target of brand impersonation (raises social engineering exposure)")
    social_engineering_score = min(social_engineering_score, 100)
    social_engineering_level = "Low" if social_engineering_score <= 25 else "Medium" if social_engineering_score <= 60 else "High"

    ai_prompt = f"""You are a cybersecurity risk advisor. A user has a digital identity risk score of {score}/100 (Risk Level: {risk_level}).
Risk factors found: {', '.join(factors) if factors else 'None'}.
Email Exposure Risk: {email_exposure_score}/100. Social Engineering Risk: {social_engineering_score}/100.
Give 3 short, professional, actionable recommendations to reduce this risk."""

    recommendations = ask_ollama(ai_prompt)

    db.execute(
        text("INSERT INTO identity_risk (user_id, score, factors_json) VALUES (:uid, :score, :factors)"),
        {
            "uid": data.user_id,
            "score": score,
            "factors": json.dumps({
                "factors": factors,
                "risk_level": risk_level,
                "email_exposure_score": email_exposure_score,
                "email_exposure_level": email_exposure_level,
                "social_engineering_score": social_engineering_score,
                "social_engineering_level": social_engineering_level,
                "social_engineering_factors": se_factors,
                "brand_impersonation_risk": "High" if data.brand_impersonation_detected else "Low",
                "username_similarity_count": data.similar_usernames_found
            })
        }
    )
    db.commit()

    return {
        "digital_identity_score": score,
        "risk_level": risk_level,
        "factors": factors,
        "brand_impersonation_risk": "High" if data.brand_impersonation_detected else "Low",
        "email_exposure_risk": {"score": email_exposure_score, "level": email_exposure_level},
        "username_similarity_count": data.similar_usernames_found,
        "social_engineering_risk": {"score": social_engineering_score, "level": social_engineering_level, "factors": se_factors},
        "ai_recommendations": recommendations
    }


# ---------------------------
# HUMAN RISK ENGINE
# (expanded: Password Hygiene score + Security Maturity score, per spec)
# ---------------------------
class HumanRiskInput(BaseModel):
    user_id: int
    phishing_click_rate: float
    security_training_completed: bool
    reported_suspicious_emails: int
    shares_credentials: bool
    clicked_unknown_links_count: int
    # New fields for password hygiene + security maturity sub-scores
    uses_password_manager: bool
    reuses_passwords_across_sites: bool
    mfa_enabled_everywhere: bool
    follows_security_policies: bool


@app.post("/human-risk")
def human_risk(data: HumanRiskInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    score = 0
    factors = []

    if data.phishing_click_rate > 0.3:
        score += 30
        factors.append(f"High phishing simulation click rate ({int(data.phishing_click_rate*100)}%)")
    elif data.phishing_click_rate > 0.1:
        score += 15
        factors.append(f"Moderate phishing simulation click rate ({int(data.phishing_click_rate*100)}%)")

    if not data.security_training_completed:
        score += 20
        factors.append("Security awareness training not completed")

    if data.shares_credentials:
        score += 25
        factors.append("Shares login credentials with others")

    if data.clicked_unknown_links_count > 2:
        score += 15
        factors.append(f"Clicked unknown/suspicious links {data.clicked_unknown_links_count} times")

    if data.reported_suspicious_emails > 0:
        score = max(0, score - min(data.reported_suspicious_emails * 5, 15))
        factors.append(f"Positive: reported {data.reported_suspicious_emails} suspicious email(s)")

    if score <= 25:
        risk_level = "Low"
    elif score <= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # --- Phishing Awareness sub-score (inverse of click rate, 0-100 where 100 = best awareness) ---
    phishing_awareness_score = max(0, round(100 - (data.phishing_click_rate * 100)))

    # --- Password Hygiene sub-score (0-100, higher = better hygiene) ---
    password_hygiene_score = 50
    if data.uses_password_manager:
        password_hygiene_score += 25
    if not data.reuses_passwords_across_sites:
        password_hygiene_score += 15
    if data.mfa_enabled_everywhere:
        password_hygiene_score += 10
    password_hygiene_score = min(password_hygiene_score, 100)
    password_hygiene_level = "Good" if password_hygiene_score >= 70 else "Fair" if password_hygiene_score >= 40 else "Poor"

    # --- Security Maturity Score (0-100, higher = more mature) ---
    security_maturity_score = 0
    if data.security_training_completed:
        security_maturity_score += 25
    if data.follows_security_policies:
        security_maturity_score += 25
    if data.mfa_enabled_everywhere:
        security_maturity_score += 25
    if data.reported_suspicious_emails > 0:
        security_maturity_score += 25
    security_maturity_level = "Advanced" if security_maturity_score >= 75 else "Developing" if security_maturity_score >= 40 else "Basic"

    ai_prompt = f"""You are a human risk behavior analyst in cybersecurity. A user has a human risk score of {score}/100 (Risk Level: {risk_level}).
Behavioral factors: {', '.join(factors) if factors else 'None'}.
Password Hygiene Score: {password_hygiene_score}/100. Security Maturity Score: {security_maturity_score}/100.
Give 3 short, professional, actionable recommendations to improve this user's security behavior."""

    recommendations = ask_ollama(ai_prompt)

    db.execute(
        text("INSERT INTO human_risk (user_id, score, factors_json) VALUES (:uid, :score, :factors)"),
        {
            "uid": data.user_id,
            "score": score,
            "factors": json.dumps({
                "factors": factors,
                "risk_level": risk_level,
                "phishing_awareness_score": phishing_awareness_score,
                "password_hygiene_score": password_hygiene_score,
                "password_hygiene_level": password_hygiene_level,
                "security_maturity_score": security_maturity_score,
                "security_maturity_level": security_maturity_level
            })
        }
    )
    db.commit()

    return {
        "human_risk_score": score,
        "risk_level": risk_level,
        "factors": factors,
        "phishing_awareness_score": phishing_awareness_score,
        "password_hygiene": {"score": password_hygiene_score, "level": password_hygiene_level},
        "security_maturity": {"score": security_maturity_score, "level": security_maturity_level},
        "ai_recommendations": recommendations
    }


# ---------------------------
# INSIDER THREAT PREDICTION MODULE (Demo Data Based)
# ---------------------------
class InsiderThreatInput(BaseModel):
    user_id: int
    employee_name: str
    after_hours_logins: int
    bulk_downloads: int
    failed_login_attempts: int
    accessed_unauthorized_files: bool
    used_personal_usb: bool
    resigned_or_notice_period: bool


@app.post("/insider-threat")
def insider_threat(data: InsiderThreatInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    score = 0
    indicators = []
    timeline = []  # per spec: "Suspicious Behaviour Timeline"

    if data.after_hours_logins > 5:
        score += 15
        indicators.append(f"Frequent after-hours logins ({data.after_hours_logins} times)")
        timeline.append({"event": "Unusual Login Pattern", "detail": f"{data.after_hours_logins} after-hours logins detected"})
    if data.bulk_downloads > 3:
        score += 20
        indicators.append(f"Unusual bulk file downloads ({data.bulk_downloads} incidents)")
        timeline.append({"event": "File Access Anomaly", "detail": f"{data.bulk_downloads} bulk download incidents"})
    if data.failed_login_attempts > 4:
        score += 10
        indicators.append(f"Multiple failed login attempts ({data.failed_login_attempts})")
        timeline.append({"event": "Unusual Login Pattern", "detail": f"{data.failed_login_attempts} failed login attempts"})
    if data.accessed_unauthorized_files:
        score += 25
        indicators.append("Accessed unauthorized/restricted files")
        timeline.append({"event": "File Access Anomaly", "detail": "Accessed unauthorized/restricted files"})
    if data.used_personal_usb:
        score += 15
        indicators.append("Used personal USB device on company system")
        timeline.append({"event": "USB Usage", "detail": "Personal USB device used on company system"})
    if data.resigned_or_notice_period:
        score += 15
        indicators.append("Employee is in notice period / recently resigned")
        timeline.append({"event": "Employment Status Flag", "detail": "Employee in notice period / recently resigned"})

    if score <= 25:
        risk_level = "Low"
    elif score <= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    ai_prompt = f"""You are an insider threat analyst. Employee "{data.employee_name}" has an insider threat score of {score}/100 (Risk Level: {risk_level}).
Indicators detected: {', '.join(indicators) if indicators else 'None'}.
Give a short professional assessment (2-3 sentences) and 3 recommended actions for the security team."""

    ai_assessment = ask_ollama(ai_prompt)

    db.execute(
        text("INSERT INTO insider_threat (user_id, score, indicators_json) VALUES (:uid, :score, :indicators)"),
        {
            "uid": data.user_id,
            "score": score,
            "indicators": json.dumps({
                "employee_name": data.employee_name,
                "indicators": indicators,
                "risk_level": risk_level,
                "timeline": timeline
            })
        }
    )
    db.commit()

    return {
        "employee_name": data.employee_name,
        "insider_threat_score": score,
        "risk_level": risk_level,
        "indicators": indicators,
        "suspicious_behaviour_timeline": timeline,
        "ai_assessment": ai_assessment
    }


# ---------------------------
# AI ATTACK STORY GENERATOR (with Timeline)
# ---------------------------
class AttackStoryInput(BaseModel):
    org_id: int
    industry: str
    attack_type: str
    company_size: str


@app.post("/attack-story")
def attack_story(data: AttackStoryInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    ai_prompt = f"""You are a cybersecurity storytelling engine. Create a realistic {data.attack_type} attack scenario for a {data.company_size} company in the {data.industry} industry.

Respond ONLY in this exact JSON format, nothing else, no extra text before or after:
{{
  "title": "short attack title",
  "summary": "2 sentence summary of the attack",
  "timeline": [
    {{"stage": "Reconnaissance", "description": "what the attacker did"}},
    {{"stage": "Initial Access", "description": "how they got in"}},
    {{"stage": "Execution", "description": "what they did once inside"}},
    {{"stage": "Impact", "description": "damage caused"}},
    {{"stage": "Detection & Response", "description": "how it was caught and stopped"}}
  ],
  "lessons_learned": ["lesson 1", "lesson 2", "lesson 3"]
}}"""

    raw_text = ask_ollama(ai_prompt)

    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        story_json = json.loads(raw_text[start:end])
    except Exception:
        story_json = {
            "title": f"{data.attack_type} Attack on {data.industry} Company",
            "summary": raw_text[:300],
            "timeline": [],
            "lessons_learned": []
        }

    db.execute(
        text("INSERT INTO attack_stories (org_id, title, timeline_json) VALUES (:oid, :title, :timeline)"),
        {
            "oid": data.org_id,
            "title": story_json.get("title", "Untitled Attack Story"),
            "timeline": json.dumps(story_json)
        }
    )
    db.commit()

    return story_json


# ---------------------------
# AI CYBER LAB GENERATOR
# (expanded: explicit Learning Path + Expected Outcome fields per spec)
# ---------------------------
class CyberLabInput(BaseModel):
    topic: str
    difficulty: str


@app.post("/cyber-lab")
def cyber_lab(data: CyberLabInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    ai_prompt = f"""You are a cybersecurity training content creator. Create a structured learning module on the topic "{data.topic}" for {data.difficulty} level learners.

Respond ONLY in this exact JSON format, nothing else, no extra text before or after:
{{
  "title": "short module title",
  "learning_path": ["step 1 concept", "step 2 concept", "step 3 concept"],
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "explanation": "clear 4-5 sentence explanation of the concept",
  "hands_on_exercise": "a short practical exercise or scenario the learner can try",
  "expected_outcome": "what the learner should be able to do after completing this lab",
  "quiz": [
    {{"question": "quiz question 1", "options": ["A", "B", "C", "D"], "correct_answer": "A"}},
    {{"question": "quiz question 2", "options": ["A", "B", "C", "D"], "correct_answer": "B"}},
    {{"question": "quiz question 3", "options": ["A", "B", "C", "D"], "correct_answer": "C"}}
  ],
  "recommendations": ["further reading or practice suggestion 1", "suggestion 2"]
}}"""

    raw_text = ask_ollama(ai_prompt)

    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        lab_json = json.loads(raw_text[start:end])
    except Exception:
        lab_json = {
            "title": f"{data.topic} ({data.difficulty})",
            "learning_path": [],
            "objectives": [],
            "explanation": raw_text[:300],
            "hands_on_exercise": "",
            "expected_outcome": "",
            "quiz": [],
            "recommendations": []
        }

    db.execute(
        text("INSERT INTO cyber_labs (title, topic, content_json, difficulty) VALUES (:title, :topic, :content, :difficulty)"),
        {
            "title": lab_json.get("title", f"{data.topic} Lab"),
            "topic": data.topic,
            "content": json.dumps(lab_json),
            "difficulty": data.difficulty
        }
    )
    db.commit()

    return lab_json


# ---------------------------
# AI SECURITY DECISION ENGINE (CISO)
# (expanded: Implementation Phases, Budget Allocation, Security Architecture Suggestions per spec)
# ---------------------------
class SecurityDecisionInput(BaseModel):
    org_id: int
    industry: str
    company_size: str
    current_tools: str
    budget: str
    number_of_employees: int
    current_security_level: str  # e.g. "None", "Basic", "Intermediate", "Advanced"


@app.post("/security-decision")
def security_decision(data: SecurityDecisionInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    ai_prompt = f"""You are acting as a Chief Information Security Officer (CISO) advisor. A {data.company_size} company in the {data.industry} industry with {data.number_of_employees} employees currently uses these security tools: {data.current_tools}. Their current security level is "{data.current_security_level}" and their security budget level is: {data.budget}.

Generate a prioritized security roadmap. Respond ONLY in this exact JSON format, nothing else, no extra text before or after:
{{
  "overall_assessment": "2-3 sentence summary of their current security posture",
  "risk_assessment": "2-3 sentence summary of the biggest risks given their current security level and industry",
  "recommendations": [
    {{"priority": "High", "category": "category name", "recommendation": "specific action", "reason": "why this matters"}},
    {{"priority": "Medium", "category": "category name", "recommendation": "specific action", "reason": "why this matters"}},
    {{"priority": "Low", "category": "category name", "recommendation": "specific action", "reason": "why this matters"}}
  ],
  "implementation_phases": [
    {{"phase": "Phase 1 (0-30 days)", "focus": "what to do first", "actions": ["action 1", "action 2"]}},
    {{"phase": "Phase 2 (1-3 months)", "focus": "what comes next", "actions": ["action 1", "action 2"]}},
    {{"phase": "Phase 3 (3-6 months)", "focus": "longer term work", "actions": ["action 1", "action 2"]}}
  ],
  "budget_allocation": [
    {{"category": "e.g. Endpoint Protection", "percentage": 30}},
    {{"category": "e.g. Employee Training", "percentage": 20}},
    {{"category": "e.g. Monitoring & Detection", "percentage": 30}},
    {{"category": "e.g. Incident Response Planning", "percentage": 20}}
  ],
  "security_architecture_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "estimated_timeline": "suggested implementation timeline as short text"
}}"""

    raw_text = ask_ollama(ai_prompt)

    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        decision_json = json.loads(raw_text[start:end])
    except Exception:
        decision_json = {
            "overall_assessment": raw_text[:300],
            "risk_assessment": "",
            "recommendations": [],
            "implementation_phases": [],
            "budget_allocation": [],
            "security_architecture_suggestions": [],
            "estimated_timeline": "N/A"
        }

    for rec in decision_json.get("recommendations", []):
        db.execute(
            text("""INSERT INTO security_recommendations (org_id, category, recommendation, priority)
                    VALUES (:oid, :category, :recommendation, :priority)"""),
            {
                "oid": data.org_id,
                "category": rec.get("category", "General"),
                "recommendation": rec.get("recommendation", ""),
                "priority": rec.get("priority", "Medium")
            }
        )
    db.commit()

    return decision_json


# ---------------------------
# ATTACK SURFACE VISUALIZATION MODULE
# (expanded: Security Layers + Risk Heatmap per spec)
# ---------------------------
class Asset(BaseModel):
    asset_name: str
    exposure_level: str
    asset_type: str


class AttackSurfaceInput(BaseModel):
    org_id: int
    assets: list[Asset]


@app.post("/attack-surface")
def attack_surface(data: AttackSurfaceInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    nodes = []
    exposure_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
    heatmap = []  # per spec: "Risk Heatmap" — one cell per asset

    # Simple standard "Security Layers" model (Perimeter -> Network -> Endpoint -> Application -> Data)
    security_layers = [
        {"layer": "Perimeter", "description": "Firewalls, VPNs, and external-facing defenses"},
        {"layer": "Network", "description": "Internal network segmentation and monitoring"},
        {"layer": "Endpoint", "description": "Devices, workstations, and servers"},
        {"layer": "Application", "description": "Web apps, APIs, and cloud services"},
        {"layer": "Data", "description": "Databases, storage, and data-at-rest protection"},
    ]

    for asset in data.assets:
        details = {"asset_type": asset.asset_type}

        db.execute(
            text("""INSERT INTO attack_surface_assets (org_id, asset_name, exposure_level, details_json)
                    VALUES (:oid, :name, :exposure, :details)"""),
            {
                "oid": data.org_id,
                "name": asset.asset_name,
                "exposure": asset.exposure_level,
                "details": json.dumps(details)
            }
        )

        weight = exposure_rank.get(asset.exposure_level, 1)
        nodes.append({
            "name": asset.asset_name,
            "type": asset.asset_type,
            "exposure_level": asset.exposure_level,
            "risk_weight": weight
        })
        heatmap.append({
            "asset": asset.asset_name,
            "risk_weight": weight,
            "color": "green" if weight == 1 else "yellow" if weight == 2 else "orange" if weight == 3 else "red"
        })

    db.commit()

    total_weight = sum(n["risk_weight"] for n in nodes)
    avg_weight = total_weight / len(nodes) if nodes else 0

    if avg_weight >= 3:
        overall_exposure = "High"
    elif avg_weight >= 2:
        overall_exposure = "Medium"
    else:
        overall_exposure = "Low"

    ai_prompt = f"""You are a cybersecurity architect. An organization has {len(nodes)} exposed assets with an overall exposure level of {overall_exposure}.
Assets: {', '.join([n['name'] + ' (' + n['exposure_level'] + ')' for n in nodes]) if nodes else 'None'}.
Give 3 short, practical recommendations to reduce this organization's attack surface."""

    recommendations = ask_ollama(ai_prompt)

    return {
        "org_id": data.org_id,
        "nodes": nodes,
        "security_layers": security_layers,
        "risk_heatmap": heatmap,
        "overall_exposure": overall_exposure,
        "total_assets": len(nodes),
        "recommendations": recommendations
    }


# ---------------------------
# MISSION CONTROL DASHBOARD
# (expanded: Recent AI Decisions + Security Timeline per spec)
# ---------------------------
@app.get("/dashboard/{org_id}")
def dashboard(org_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    identity = db.execute(
        text("""SELECT ir.score, ir.factors_json, ir.created_at
                FROM identity_risk ir
                JOIN users u ON ir.user_id = u.id
                WHERE u.org_id = :oid
                ORDER BY ir.created_at DESC LIMIT 1"""),
        {"oid": org_id}
    ).fetchone()

    human = db.execute(
        text("""SELECT hr.score, hr.factors_json, hr.created_at
                FROM human_risk hr
                JOIN users u ON hr.user_id = u.id
                WHERE u.org_id = :oid
                ORDER BY hr.created_at DESC LIMIT 1"""),
        {"oid": org_id}
    ).fetchone()

    insider = db.execute(
        text("""SELECT it.score, it.indicators_json, it.created_at
                FROM insider_threat it
                JOIN users u ON it.user_id = u.id
                WHERE u.org_id = :oid
                ORDER BY it.created_at DESC LIMIT 1"""),
        {"oid": org_id}
    ).fetchone()

    recent_stories = db.execute(
        text("""SELECT id, title, created_at FROM attack_stories
                WHERE org_id = :oid ORDER BY created_at DESC LIMIT 3"""),
        {"oid": org_id}
    ).fetchall()

    recent_reports = db.execute(
        text("""SELECT id, type, created_at FROM reports
                WHERE org_id = :oid ORDER BY created_at DESC LIMIT 3"""),
        {"oid": org_id}
    ).fetchall()

    # NEW: Recent AI Decisions (from security_recommendations table)
    recent_decisions = db.execute(
        text("""SELECT id, category, recommendation, priority, created_at FROM security_recommendations
                WHERE org_id = :oid ORDER BY created_at DESC LIMIT 5"""),
        {"oid": org_id}
    ).fetchall()

    scores = []
    if identity: scores.append(identity[0])
    if human: scores.append(human[0])
    if insider: scores.append(insider[0])

    overall_risk_score = round(sum(scores) / len(scores), 1) if scores else 0

    # NEW: Security Timeline — merge all timestamped events into one sorted feed
    timeline_events = []
    if identity:
        timeline_events.append({"type": "Identity Risk Assessment", "timestamp": identity[2]})
    if human:
        timeline_events.append({"type": "Human Risk Assessment", "timestamp": human[2]})
    if insider:
        timeline_events.append({"type": "Insider Threat Assessment", "timestamp": insider[2]})
    for r in recent_stories:
        timeline_events.append({"type": f"Attack Story: {r[1]}", "timestamp": r[2]})
    for r in recent_reports:
        timeline_events.append({"type": f"Report Generated: {r[1]}", "timestamp": r[2]})
    for d in recent_decisions:
        timeline_events.append({"type": f"AI Decision: {d[1]}", "timestamp": d[4]})

    timeline_events.sort(key=lambda e: e["timestamp"] if e["timestamp"] else datetime.min, reverse=True)

    return {
        "org_id": org_id,
        "overall_risk_score": overall_risk_score,
        "identity_risk": {
            "score": identity[0] if identity else None,
            "factors": identity[1] if identity else None,
            "last_updated": identity[2] if identity else None
        } if identity else None,
        "human_risk": {
            "score": human[0] if human else None,
            "factors": human[1] if human else None,
            "last_updated": human[2] if human else None
        } if human else None,
        "insider_threat": {
            "score": insider[0] if insider else None,
            "indicators": insider[1] if insider else None,
            "last_updated": insider[2] if insider else None
        } if insider else None,
        "recent_attack_stories": [
            {"id": r[0], "title": r[1], "created_at": r[2]} for r in recent_stories
        ],
        "recent_reports": [
            {"id": r[0], "type": r[1], "created_at": r[2]} for r in recent_reports
        ],
        "recent_ai_decisions": [
            {"id": d[0], "category": d[1], "recommendation": d[2], "priority": d[3], "created_at": d[4]}
            for d in recent_decisions
        ],
        "security_timeline": timeline_events[:10]
    }


# ---------------------------
# REPORT GENERATOR (Executive Summary + PDF Export)
# ---------------------------
class ReportInput(BaseModel):
    org_id: int
    report_type: str = "Executive Summary"


@app.post("/report")
def generate_report(data: ReportInput, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    identity = db.execute(
        text("""SELECT ir.score, ir.factors_json FROM identity_risk ir
                JOIN users u ON ir.user_id = u.id
                WHERE u.org_id = :oid ORDER BY ir.created_at DESC LIMIT 1"""),
        {"oid": data.org_id}
    ).fetchone()

    human = db.execute(
        text("""SELECT hr.score, hr.factors_json FROM human_risk hr
                JOIN users u ON hr.user_id = u.id
                WHERE u.org_id = :oid ORDER BY hr.created_at DESC LIMIT 1"""),
        {"oid": data.org_id}
    ).fetchone()

    insider = db.execute(
        text("""SELECT it.score, it.indicators_json FROM insider_threat it
                JOIN users u ON it.user_id = u.id
                WHERE u.org_id = :oid ORDER BY it.created_at DESC LIMIT 1"""),
        {"oid": data.org_id}
    ).fetchone()

    stories = db.execute(
        text("""SELECT title FROM attack_stories
                WHERE org_id = :oid ORDER BY created_at DESC LIMIT 3"""),
        {"oid": data.org_id}
    ).fetchall()

    org = db.execute(
        text("SELECT name, industry, size FROM organizations WHERE id = :oid"),
        {"oid": data.org_id}
    ).fetchone()

    org_name = org[0] if org else "Unknown Org"
    org_industry = org[1] if org else "Unknown"
    org_size = org[2] if org else "Unknown"

    summary_data = {
        "organization": org_name,
        "industry": org_industry,
        "size": org_size,
        "identity_risk_score": identity[0] if identity else "N/A",
        "human_risk_score": human[0] if human else "N/A",
        "insider_threat_score": insider[0] if insider else "N/A",
        "recent_attack_scenarios": [s[0] for s in stories]
    }

    ai_prompt = f"""You are a cybersecurity consultant writing an executive summary report for company leadership.

Organization: {org_name} ({org_industry} industry, {org_size} size)
Identity Risk Score: {summary_data['identity_risk_score']}/100
Human Risk Score: {summary_data['human_risk_score']}/100
Insider Threat Score: {summary_data['insider_threat_score']}/100
Recent simulated attack scenarios reviewed: {', '.join(summary_data['recent_attack_scenarios']) if summary_data['recent_attack_scenarios'] else 'None'}

Write a professional executive summary (5-7 sentences) covering: overall security posture, key risk areas, and top 2-3 priorities for the next quarter. Write in plain professional English, no JSON, no headers, just flowing paragraphs suitable for a PDF report."""

    executive_summary = ask_ollama(ai_prompt)

    report_content = {
        "raw_data": summary_data,
        "executive_summary": executive_summary
    }

    result = db.execute(
        text("""INSERT INTO reports (org_id, type, content_json)
                VALUES (:oid, :type, :content) RETURNING id"""),
        {
            "oid": data.org_id,
            "type": data.report_type,
            "content": json.dumps(report_content)
        }
    )
    new_report_id = result.fetchone()[0]
    db.commit()

    report_content["report_id"] = new_report_id
    return report_content


@app.get("/report/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """Generates a PDF on the fly from a saved report and returns it as a download."""
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm

    row = db.execute(
        text("SELECT org_id, type, content_json, created_at FROM reports WHERE id = :rid"),
        {"rid": report_id}
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Report not found")

    org_id, report_type, content_json, created_at = row
    content = json.loads(content_json) if isinstance(content_json, str) else content_json
    raw_data = content.get("raw_data", {})
    executive_summary = content.get("executive_summary", "")

    output_dir = "generated_reports"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"report_{report_id}.pdf")

    doc = SimpleDocTemplate(file_path, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#0E6E4E"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#1B211D"))
    body_style = styles["BodyText"]

    elements = []
    elements.append(Paragraph("Vanguard AI — Security Report", title_style))
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph(f"Report Type: {report_type}", body_style))
    elements.append(Paragraph(f"Generated: {created_at}", body_style))
    elements.append(Spacer(1, 0.7*cm))

    elements.append(Paragraph("Organization Overview", heading_style))
    org_table_data = [
        ["Organization", raw_data.get("organization", "N/A")],
        ["Industry", raw_data.get("industry", "N/A")],
        ["Size", raw_data.get("size", "N/A")],
    ]
    org_table = Table(org_table_data, colWidths=[5*cm, 10*cm])
    org_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E7F3ED")),
    ]))
    elements.append(org_table)
    elements.append(Spacer(1, 0.7*cm))

    elements.append(Paragraph("Risk Scores", heading_style))
    scores_table_data = [
        ["Category", "Score (0-100)"],
        ["Digital Identity Risk", str(raw_data.get("identity_risk_score", "N/A"))],
        ["Human Risk", str(raw_data.get("human_risk_score", "N/A"))],
        ["Insider Threat", str(raw_data.get("insider_threat_score", "N/A"))],
    ]
    scores_table = Table(scores_table_data, colWidths=[8*cm, 7*cm])
    scores_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C9A24B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ]))
    elements.append(scores_table)
    elements.append(Spacer(1, 0.7*cm))

    elements.append(Paragraph("Executive Summary", heading_style))
    elements.append(Paragraph(executive_summary.replace("\n", "<br/>"), body_style))

    doc.build(elements)

    return FileResponse(file_path, media_type="application/pdf", filename=f"Vanguard_AI_Report_{report_id}.pdf")


# ---------------------------
# FILE UPLOAD ANALYSIS MODULE
# ---------------------------
@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...), current_user: dict = Depends(verify_token)):
    """Accepts a text-based file (log, config, code, .txt, .csv, .json etc.) and asks the AI to analyze it for security issues."""
    allowed_extensions = (".txt", ".log", ".csv", ".json", ".py", ".js", ".yaml", ".yml", ".conf", ".ini", ".md")

    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    file_bytes = await file.read()

    try:
        file_text = file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read file as text")

    max_chars = 6000
    truncated = file_text[:max_chars]
    was_truncated = len(file_text) > max_chars

    ai_prompt = f"""You are a cybersecurity analyst. Analyze the following file content (filename: {file.filename}) for security issues, misconfigurations, suspicious patterns, exposed secrets, or vulnerabilities.

File content:
---
{truncated}
---

Respond ONLY in this exact JSON format, nothing else, no extra text before or after:
{{
  "summary": "2-3 sentence overview of what this file appears to be and its security posture",
  "findings": [
    {{"severity": "High", "issue": "description of the issue", "recommendation": "how to fix it"}},
    {{"severity": "Medium", "issue": "description of the issue", "recommendation": "how to fix it"}}
  ],
  "overall_risk": "Low, Medium, or High"
}}"""

    raw_text = ask_ollama(ai_prompt)

    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        analysis_json = json.loads(raw_text[start:end])
    except Exception:
        analysis_json = {
            "summary": raw_text[:300],
            "findings": [],
            "overall_risk": "Unknown"
        }

    analysis_json["filename"] = file.filename
    analysis_json["truncated"] = was_truncated

    return analysis_json


class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    org_id: int = None


class LoginInput(BaseModel):
    email: str
    password: str


# ---------------------------
# REGISTER
# ---------------------------
@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(data.password)

    result = db.execute(
        text("""INSERT INTO users (name, email, password_hash, org_id)
                VALUES (:name, :email, :password_hash, :org_id) RETURNING id"""),
        {"name": data.name, "email": data.email, "password_hash": hashed_password, "org_id": data.org_id}
    )
    new_user_id = result.fetchone()[0]
    db.commit()

    token = create_access_token({"user_id": new_user_id, "email": data.email})

    return {"message": "Registered successfully", "access_token": token, "token_type": "bearer"}


# ---------------------------
# LOGIN
# ---------------------------
@app.post("/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT id, password_hash, name FROM users WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not user or not pwd_context.verify(data.password, user[1]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user[0], "email": data.email})

    return {"message": "Login successful", "access_token": token, "token_type": "bearer", "user_name": user[2]}


# ---------------------------
# LOGIN / SIGNUP WITH GOOGLE
# Frontend sends the Google ID token it got from Google Identity Services.
# We verify it with Google, then find-or-create the user, and return our own JWT
# (same format as /login), so the rest of the app doesn't need to change at all.
# ---------------------------
class GoogleLoginInput(BaseModel):
    credential: str  # the ID token (JWT) from Google


@app.post("/login/google")
def login_google(data: GoogleLoginInput, db: Session = Depends(get_db)):
    # Verify the token directly with Google's tokeninfo endpoint (no extra library needed)
    verify_res = requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": data.credential}
    )
    if verify_res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = verify_res.json()

    # Make sure the token was issued for OUR app, not someone else's
    if GOOGLE_CLIENT_ID and google_data.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Google token was not issued for this app")

    email = google_data.get("email")
    name = google_data.get("name", email.split("@")[0] if email else "Google User")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = db.execute(
        text("SELECT id, name FROM users WHERE email = :email"),
        {"email": email}
    ).fetchone()

    if user:
        user_id = user[0]
    else:
        # First time logging in with this Google account -> auto-register them
        # random unusable password hash since they'll only ever log in via Google
        random_password_hash = pwd_context.hash(os.urandom(24).hex())
        result = db.execute(
            text("""INSERT INTO users (name, email, password_hash, org_id)
                    VALUES (:name, :email, :password_hash, NULL) RETURNING id"""),
            {"name": name, "email": email, "password_hash": random_password_hash}
        )
        user_id = result.fetchone()[0]
        db.commit()

    token = create_access_token({"user_id": user_id, "email": email})

    return {"message": "Google login successful", "access_token": token, "token_type": "bearer", "user_name": name}


# ---------------------------
# EXAMPLE: PROTECTED ROUTE (returns role too, so frontend knows if user is admin)
# ---------------------------
@app.get("/me")
def get_me(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    row = db.execute(
        text("SELECT name, role, org_id FROM users WHERE id = :uid"),
        {"uid": current_user["user_id"]}
    ).fetchone()
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": row[0] if row else None,
        "role": row[1] if row else "user",
        "org_id": row[2] if row else None,
    }


class AdminLoginInput(BaseModel):
    email: str
    password: str


class AdminChangePasswordInput(BaseModel):
    current_password: str
    new_password: str


@app.post("/admin-login")
def admin_login(data: AdminLoginInput, db: Session = Depends(get_db)):
    """Separate login for the admin panel — checks the isolated 'admins' table, not 'users'."""
    admin = db.execute(
        text("SELECT id, password_hash FROM admins WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not admin or not pwd_context.verify(data.password, admin[1]):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    token = create_access_token({"admin_id": admin[0], "email": data.email, "role": "admin"})

    return {"message": "Admin login successful", "access_token": token, "token_type": "bearer"}


@app.patch("/admin/change-password")
def admin_change_password(data: AdminChangePasswordInput, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    row = db.execute(
        text("SELECT password_hash FROM admins WHERE id = :aid"),
        {"aid": admin_user["admin_id"]}
    ).fetchone()

    if not row or not pwd_context.verify(data.current_password, row[0]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    new_hash = pwd_context.hash(data.new_password)
    db.execute(
        text("UPDATE admins SET password_hash = :new_hash WHERE id = :aid"),
        {"new_hash": new_hash, "aid": admin_user["admin_id"]}
    )
    db.commit()

    return {"message": "Admin password updated successfully"}


# ---------------------------
# ADMIN PANEL — dashboard/data endpoints (all require verify_admin)
# ---------------------------
@app.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).fetchone()[0]
    total_orgs = db.execute(text("SELECT COUNT(*) FROM organizations")).fetchone()[0]
    total_reports = db.execute(text("SELECT COUNT(*) FROM reports")).fetchone()[0]
    total_attack_stories = db.execute(text("SELECT COUNT(*) FROM attack_stories")).fetchone()[0]
    total_chat_messages = db.execute(text("SELECT COUNT(*) FROM chat_messages")).fetchone()[0]

    avg_identity = db.execute(text("SELECT AVG(score) FROM identity_risk")).fetchone()[0]
    avg_human = db.execute(text("SELECT AVG(score) FROM human_risk")).fetchone()[0]
    avg_insider = db.execute(text("SELECT AVG(score) FROM insider_threat")).fetchone()[0]

    return {
        "total_users": total_users,
        "total_organizations": total_orgs,
        "total_reports": total_reports,
        "total_attack_stories": total_attack_stories,
        "total_chat_messages": total_chat_messages,
        "average_identity_risk": round(avg_identity, 1) if avg_identity else None,
        "average_human_risk": round(avg_human, 1) if avg_human else None,
        "average_insider_threat": round(avg_insider, 1) if avg_insider else None,
    }


@app.get("/admin/users")
def admin_list_users(db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    rows = db.execute(
        text("""SELECT u.id, u.name, u.email, u.role, u.org_id, o.name, u.created_at
                FROM users u LEFT JOIN organizations o ON u.org_id = o.id
                ORDER BY u.created_at DESC""")
    ).fetchall()

    return {
        "users": [
            {
                "id": r[0], "name": r[1], "email": r[2], "role": r[3],
                "org_id": r[4], "org_name": r[5], "created_at": r[6]
            } for r in rows
        ]
    }


class RoleUpdateInput(BaseModel):
    role: str  # "admin" or "user"


@app.patch("/admin/users/{user_id}/role")
def admin_update_role(user_id: int, data: RoleUpdateInput, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    if data.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")

    result = db.execute(
        text("UPDATE users SET role = :role WHERE id = :uid RETURNING id"),
        {"role": data.role, "uid": user_id}
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    db.commit()

    return {"message": f"User {user_id} role updated to '{data.role}'"}


@app.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: int, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    result = db.execute(
        text("DELETE FROM users WHERE id = :uid RETURNING id"),
        {"uid": user_id}
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    db.commit()

    return {"message": f"User {user_id} deleted"}


@app.get("/admin/organizations")
def admin_list_organizations(db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    rows = db.execute(
        text("""SELECT o.id, o.name, o.industry, o.size, o.created_at,
                       (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count
                FROM organizations o ORDER BY o.created_at DESC""")
    ).fetchall()

    return {
        "organizations": [
            {
                "id": r[0], "name": r[1], "industry": r[2], "size": r[3],
                "created_at": r[4], "user_count": r[5]
            } for r in rows
        ]
    }


# ---------------------------
# ADMIN → USER FULL ACTIVITY MONITORING
# (chat history, risk assessments, everything the user has done)
# ---------------------------
@app.get("/admin/users/{user_id}/activity")
def admin_user_activity(user_id: int, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    user_row = db.execute(
        text("SELECT id, name, email, org_id, created_at FROM users WHERE id = :uid"),
        {"uid": user_id}
    ).fetchone()

    if not user_row:
        raise HTTPException(status_code=404, detail="User not found")

    # All chat sessions + messages by this user
    chat_sessions = db.execute(
        text("SELECT id, title, created_at FROM chat_sessions WHERE user_id = :uid ORDER BY created_at DESC"),
        {"uid": user_id}
    ).fetchall()

    session_ids = [s[0] for s in chat_sessions]
    chat_messages = []
    if session_ids:
        rows = db.execute(
            text("""SELECT session_id, sender, message, created_at FROM chat_messages
                    WHERE session_id = ANY(:sids) ORDER BY created_at ASC"""),
            {"sids": session_ids}
        ).fetchall()
        chat_messages = [
            {"session_id": r[0], "sender": r[1], "message": r[2], "created_at": r[3]} for r in rows
        ]

    # All risk assessments this specific user has submitted
    identity_history = db.execute(
        text("SELECT score, factors_json, created_at FROM identity_risk WHERE user_id = :uid ORDER BY created_at DESC"),
        {"uid": user_id}
    ).fetchall()

    human_history = db.execute(
        text("SELECT score, factors_json, created_at FROM human_risk WHERE user_id = :uid ORDER BY created_at DESC"),
        {"uid": user_id}
    ).fetchall()

    insider_history = db.execute(
        text("SELECT score, indicators_json, created_at FROM insider_threat WHERE user_id = :uid ORDER BY created_at DESC"),
        {"uid": user_id}
    ).fetchall()

    return {
        "user": {
            "id": user_row[0], "name": user_row[1], "email": user_row[2],
            "org_id": user_row[3], "joined": user_row[4]
        },
        "chat_sessions": [{"id": s[0], "title": s[1], "created_at": s[2]} for s in chat_sessions],
        "chat_messages": chat_messages,
        "identity_risk_history": [
            {"score": r[0], "factors": r[1], "created_at": r[2]} for r in identity_history
        ],
        "human_risk_history": [
            {"score": r[0], "factors": r[1], "created_at": r[2]} for r in human_history
        ],
        "insider_threat_history": [
            {"score": r[0], "indicators": r[1], "created_at": r[2]} for r in insider_history
        ],
    }


# ---------------------------
# ADMIN → USER MESSAGING
# (admin can send a direct message to any user; user can read messages sent to them)
# Requires a new table: admin_messages (see SQL in the setup guide)
# ---------------------------
class AdminMessageInput(BaseModel):
    message: str


@app.post("/admin/messages/{user_id}")
def admin_send_message(user_id: int, data: AdminMessageInput, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    user_exists = db.execute(text("SELECT id FROM users WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    db.execute(
        text("""INSERT INTO admin_messages (user_id, message, is_read)
                VALUES (:uid, :msg, false)"""),
        {"uid": user_id, "msg": data.message}
    )
    db.commit()

    return {"message": "Message sent to user"}


@app.get("/admin/messages/{user_id}")
def admin_view_messages_to_user(user_id: int, db: Session = Depends(get_db), admin_user: dict = Depends(verify_admin)):
    rows = db.execute(
        text("SELECT id, message, is_read, created_at FROM admin_messages WHERE user_id = :uid ORDER BY created_at DESC"),
        {"uid": user_id}
    ).fetchall()

    return {
        "messages": [
            {"id": r[0], "message": r[1], "is_read": r[2], "created_at": r[3]} for r in rows
        ]
    }


# ---------------------------
# USER-SIDE: view messages sent to them by admin
# ---------------------------
@app.get("/my-messages")
def my_messages(db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    rows = db.execute(
        text("""SELECT id, message, is_read, created_at FROM admin_messages
                WHERE user_id = :uid ORDER BY created_at DESC"""),
        {"uid": current_user["user_id"]}
    ).fetchall()

    return {
        "messages": [
            {"id": r[0], "message": r[1], "is_read": r[2], "created_at": r[3]} for r in rows
        ]
    }


@app.patch("/my-messages/{message_id}/read")
def mark_message_read(message_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    result = db.execute(
        text("""UPDATE admin_messages SET is_read = true
                WHERE id = :mid AND user_id = :uid RETURNING id"""),
        {"mid": message_id, "uid": current_user["user_id"]}
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="Message not found")
    db.commit()
    return {"message": "Marked as read"}