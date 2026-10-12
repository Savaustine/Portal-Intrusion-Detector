import os
import sys
from pathlib import Path

# Ensure sentryportal backend and root are in sys.path
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ROOT_DIR = _BACKEND_DIR.parent
for _p in [str(_BACKEND_DIR), str(_ROOT_DIR)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.auth import (
    create_access_token,
    get_current_admin_user,
    get_current_faculty_or_admin_user,
    get_current_user,
    hash_password,
    verify_password,
)
from app.core.database import Base, SessionLocal, engine
from app.core.ids import load_model, log_activity
from app.models.activity import ActivityLog, Alert
from app.models.grade import Grade
from app.models.user import User

app = FastAPI(
    title="SentryPortal API",
    description="Backend API for SentryPortal simulated school portal with integrated IDS",
    version="0.2.0",
)

# CORS Middleware Configuration
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
origins = [
    origin.strip()
    for origin in os.getenv("SENTRYPORTAL_CORS_ORIGINS", "").split(",")
    if origin.strip()
] or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database conflict or constraint violation. Please verify unique fields."},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Database error: {str(exc.__class__.__name__)}"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the exception for debugging
    error_msg = str(exc) if str(exc) else exc.__class__.__name__
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Server error: {error_msg}"},
    )


# ==========================================
# REQUEST SCHEMAS
# ==========================================

class RegisterRequest(BaseModel):
    reg_number: str
    full_name: str
    password: str
    username: str | None = None
    email: str | None = None
    role: str = "student"


class LoginRequest(BaseModel):
    reg_number: str | None = None
    username: str | None = None
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class GradeUploadRequest(BaseModel):
    reg_number: str
    course_code: str
    course_name: str
    grade: str
    credits: int = 3
    semester: str = "Fall 2026"


class GradeUpdateRequest(BaseModel):
    course_code: str | None = None
    course_name: str | None = None
    grade: str | None = None
    credits: int | None = None
    semester: str | None = None


# ==========================================
# STARTUP & DB INITIALIZATION
# ==========================================

def init_db_schema_and_seed() -> None:
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column migration if old table exists
    with engine.connect() as conn:
        try:
            cursor = conn.exec_driver_sql("PRAGMA table_info(users)")
            cols = [row[1] for row in cursor.fetchall()]
            if cols and "reg_number" not in cols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN reg_number VARCHAR(80)")
            if cols and "full_name" not in cols:
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN full_name VARCHAR(150)")
            conn.commit()
        except Exception:
            pass

    # Seed default demonstration users & initial grades
    with SessionLocal() as session:
        # Seed Student
        student = session.query(User).filter(
            or_(User.reg_number == "STU/2026/001", User.username == "alexander")
        ).first()
        if not student:
            student = User(
                reg_number="STU/2026/001",
                full_name="Alexander Hayes",
                username="alexander",
                email="alexander.hayes@school.edu",
                role="student",
                password_hash=hash_password("password123"),
            )
            session.add(student)
            session.commit()
            session.refresh(student)

        # Seed Faculty
        faculty = session.query(User).filter(
            or_(User.reg_number == "FAC/2026/010", User.username == "dr.vance")
        ).first()
        if not faculty:
            faculty = User(
                reg_number="FAC/2026/010",
                full_name="Dr. Eleanor Vance",
                username="dr.vance",
                email="eleanor.vance@school.edu",
                role="faculty",
                password_hash=hash_password("password123"),
            )
            session.add(faculty)
            session.commit()

        # Seed Admin
        admin = session.query(User).filter(
            or_(User.reg_number == "ADM/2026/999", User.username == "admin")
        ).first()
        if not admin:
            admin = User(
                reg_number="ADM/2026/999",
                full_name="Security Operations Admin",
                username="admin",
                email="admin.soc@school.edu",
                role="admin",
                password_hash=hash_password("password123"),
            )
            session.add(admin)
            session.commit()

        # Seed default student grades if none exist
        if session.query(Grade).count() == 0 and student:
            sample_grades = [
                Grade(
                    student_id=student.id,
                    reg_number=student.reg_number,
                    student_name=student.full_name,
                    course_code="CS-401",
                    course_name="Network & Systems Security",
                    grade="A",
                    credits=4,
                    semester="Fall 2026",
                    uploaded_by="Dr. Eleanor Vance",
                ),
                Grade(
                    student_id=student.id,
                    reg_number=student.reg_number,
                    student_name=student.full_name,
                    course_code="CS-350",
                    course_name="Applied Machine Learning",
                    grade="A-",
                    credits=3,
                    semester="Fall 2026",
                    uploaded_by="Dr. Eleanor Vance",
                ),
                Grade(
                    student_id=student.id,
                    reg_number=student.reg_number,
                    student_name=student.full_name,
                    course_code="CS-210",
                    course_name="Data Structures & Algorithms",
                    grade="B+",
                    credits=4,
                    semester="Fall 2026",
                    uploaded_by="Prof. Richard Miller",
                ),
                Grade(
                    student_id=student.id,
                    reg_number=student.reg_number,
                    student_name=student.full_name,
                    course_code="MATH-240",
                    course_name="Discrete Mathematics & Logic",
                    grade="A",
                    credits=3,
                    semester="Fall 2026",
                    uploaded_by="Dr. Sarah Jenkins",
                ),
            ]
            session.add_all(sample_grades)
            session.commit()


@app.on_event("startup")
def startup() -> None:
    init_db_schema_and_seed()
    load_model()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SentryPortal API", "version": "0.2.0"}


# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    cleaned_reg = request.reg_number.strip().upper()
    cleaned_name = request.full_name.strip()
    role = request.role.lower().strip() if request.role else "student"
    id_label = "Registration Number" if role == "student" else "Staff ID"
    
    if not cleaned_reg:
        raise HTTPException(status_code=422, detail=f"{id_label} is required")
    if not cleaned_name:
        raise HTTPException(status_code=422, detail="Full name is required")

    # Username defaults to registration number / staff ID if not explicitly set
    clean_username = request.username.strip() if request.username else cleaned_reg

    with SessionLocal() as session:
        # Check if registration number / staff ID or username is already in use
        existing = session.query(User).filter(
            or_(
                User.reg_number == cleaned_reg,
                User.username == clean_username,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"{id_label} '{cleaned_reg}' is already registered",
            )

        user = User(
            reg_number=cleaned_reg,
            full_name=cleaned_name,
            username=clean_username,
            email=request.email.strip() if request.email else None,
            role=role,
            password_hash=hash_password(request.password),
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        return {
            "message": "Account created successfully",
            "user": {
                "id": user.id,
                "reg_number": user.reg_number,
                "full_name": user.full_name,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
        }


@app.post("/api/auth/login")
def login(request: LoginRequest):
    # Support login with either reg_number or username field
    identifier = (request.reg_number or request.username or "").strip()
    if not identifier:
        raise HTTPException(status_code=422, detail="Registration Number / Staff ID is required")

    with SessionLocal() as session:
        user = session.query(User).filter(
            or_(
                User.reg_number.ilike(identifier),
                User.username.ilike(identifier),
            )
        ).first()

        if user is None or not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid Registration Number / Staff ID or password")

        token = create_access_token(user)
        log_activity(user.id, "login", True, db=session)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "reg_number": user.reg_number or user.username,
                "full_name": user.full_name or user.username,
                "username": user.username or user.reg_number,
                "email": user.email,
                "role": user.role,
            },
        }


# ==========================================
# STUDENT PORTAL & ACADEMIC ROUTES
# ==========================================

@app.get("/api/portal/dashboard")
def dashboard(user: User = Depends(get_current_user)):
    log_activity(user.id, "view_dashboard")
    with SessionLocal() as session:
        grades_count = session.query(Grade).filter(
            or_(Grade.reg_number == user.reg_number, Grade.student_id == user.id)
        ).count()
        if grades_count == 0 and user.role == "student":
            grades_count = 4

    return {
        "message": "Connected to Secure Academic Gateway",
        "user": {
            "id": user.id,
            "reg_number": user.reg_number or user.username,
            "full_name": user.full_name or user.username,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        },
        "stats": {
            "courses_count": grades_count,
            "files_count": 5,
            "last_login": "Just now",
        },
    }


@app.get("/api/portal/grades")
def grades(reg_number: str | None = None, user: User = Depends(get_current_user)):
    log_activity(user.id, "view_grades")
    with SessionLocal() as session:
        if user.role == "student":
            user_reg = user.reg_number or user.username
            query = session.query(Grade).filter(
                or_(
                    Grade.reg_number.ilike(user_reg),
                    Grade.student_id == user.id,
                )
            ).order_by(Grade.course_code.asc())
            results = query.all()
        else:
            # Faculty & Admin can list all or filter by reg_number
            query = session.query(Grade)
            if reg_number:
                query = query.filter(Grade.reg_number.ilike(reg_number.strip()))
            results = query.order_by(Grade.created_at.desc()).all()

        return [
            {
                "id": g.id,
                "student_id": g.student_id,
                "reg_number": g.reg_number,
                "student_name": g.student_name or user.full_name,
                "course_code": g.course_code,
                "course_name": g.course_name,
                "grade": g.grade,
                "credits": g.credits,
                "semester": g.semester,
                "uploaded_by": g.uploaded_by or "Faculty Office",
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in results
        ]


# ==========================================
# FACULTY / RESULT UPLOAD & LOOKUP ROUTES
# ==========================================

@app.get("/api/portal/students/lookup")
@app.get("/api/portal/students/lookup/{reg_number:path}")
def lookup_student(reg_number: str | None = None, current_user: User = Depends(get_current_user)):
    if not reg_number:
        raise HTTPException(status_code=422, detail="Registration number is required")

    cleaned_reg = reg_number.strip()
    with SessionLocal() as session:
        student = session.query(User).filter(
            or_(
                User.reg_number.ilike(cleaned_reg),
                User.username.ilike(cleaned_reg),
            )
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student with registration number '{cleaned_reg}' was not found in database.",
            )

        return {
            "found": True,
            "id": student.id,
            "reg_number": student.reg_number,
            "full_name": student.full_name,
            "username": student.username,
            "email": student.email,
            "role": student.role,
        }



@app.get("/api/portal/students")
def list_students(current_user: User = Depends(get_current_user)):
    with SessionLocal() as session:
        students = session.query(User).filter(User.role == "student").order_by(User.full_name.asc()).all()
        return [
            {
                "id": s.id,
                "reg_number": s.reg_number,
                "full_name": s.full_name,
                "username": s.username,
                "email": s.email,
                "role": s.role,
            }
            for s in students
        ]


@app.post("/api/portal/grades/upload")
def upload_grade(request: GradeUploadRequest, user: User = Depends(get_current_faculty_or_admin_user)):
    cleaned_reg = request.reg_number.strip()
    if not cleaned_reg:
        raise HTTPException(status_code=422, detail="Registration number is required")

    with SessionLocal() as session:
        student = session.query(User).filter(
            or_(
                User.reg_number.ilike(cleaned_reg),
                User.username.ilike(cleaned_reg),
            )
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student with registration number '{cleaned_reg}' was not found. Please verify the Reg Number.",
            )

        # Check if an existing grade entry for this student, course, and semester exists
        existing_grade = session.query(Grade).filter(
            or_(Grade.reg_number.ilike(student.reg_number), Grade.student_id == student.id),
            Grade.course_code.ilike(request.course_code.strip()),
            Grade.semester.ilike(request.semester.strip()),
        ).first()

        if existing_grade:
            existing_grade.course_name = request.course_name.strip()
            existing_grade.grade = request.grade.strip().upper()
            existing_grade.credits = request.credits
            existing_grade.student_name = student.full_name
            existing_grade.uploaded_by = user.full_name or user.username
            grade_obj = existing_grade
        else:
            grade_obj = Grade(
                student_id=student.id,
                reg_number=student.reg_number,
                student_name=student.full_name,
                course_code=request.course_code.strip().upper(),
                course_name=request.course_name.strip(),
                grade=request.grade.strip().upper(),
                credits=request.credits,
                semester=request.semester.strip(),
                uploaded_by=user.full_name or user.username,
            )
            session.add(grade_obj)

        session.commit()
        session.refresh(grade_obj)

        log_activity(user.id, "upload_grade", True, db=session)

        return {
            "message": f"Grade successfully saved for {student.full_name} ({student.reg_number})",
            "grade": {
                "id": grade_obj.id,
                "student_id": grade_obj.student_id,
                "reg_number": grade_obj.reg_number,
                "student_name": grade_obj.student_name,
                "course_code": grade_obj.course_code,
                "course_name": grade_obj.course_name,
                "grade": grade_obj.grade,
                "credits": grade_obj.credits,
                "semester": grade_obj.semester,
                "uploaded_by": grade_obj.uploaded_by,
            },
        }


@app.put("/api/portal/grades/{grade_id}")
def update_grade(grade_id: int, request: GradeUpdateRequest, user: User = Depends(get_current_faculty_or_admin_user)):
    with SessionLocal() as session:
        grade = session.get(Grade, grade_id)
        if not grade:
            raise HTTPException(status_code=404, detail="Grade record not found")

        if request.course_code is not None:
            grade.course_code = request.course_code.strip().upper()
        if request.course_name is not None:
            grade.course_name = request.course_name.strip()
        if request.grade is not None:
            grade.grade = request.grade.strip().upper()
        if request.credits is not None:
            grade.credits = request.credits
        if request.semester is not None:
            grade.semester = request.semester.strip()

        grade.uploaded_by = user.full_name or user.username
        session.commit()
        session.refresh(grade)

        log_activity(user.id, "update_grade", True, db=session)
        return {
            "message": f"Grade updated successfully for {grade.student_name or grade.reg_number}",
            "grade": {
                "id": grade.id,
                "student_id": grade.student_id,
                "reg_number": grade.reg_number,
                "student_name": grade.student_name,
                "course_code": grade.course_code,
                "course_name": grade.course_name,
                "grade": grade.grade,
                "credits": grade.credits,
                "semester": grade.semester,
                "uploaded_by": grade.uploaded_by,
            },
        }


@app.delete("/api/portal/grades/{grade_id}")
def delete_grade(grade_id: int, user: User = Depends(get_current_faculty_or_admin_user)):
    with SessionLocal() as session:
        grade = session.get(Grade, grade_id)
        if not grade:
            raise HTTPException(status_code=404, detail="Grade record not found")
        session.delete(grade)
        session.commit()
        return {"message": "Grade record deleted successfully", "grade_id": grade_id}


# ==========================================
# FILE DOWNLOAD & OTHER ROUTES
# ==========================================

@app.get("/api/portal/files")
def files(user: User = Depends(get_current_user)):
    log_activity(user.id, "view_files")
    return [
        {
            "id": 1,
            "filename": "Network_Security_Syllabus_2026.pdf",
            "course": "CS-401: Network & Systems Security",
            "size": "2.4 MB",
            "uploaded_at": "2026-09-15",
        },
        {
            "id": 2,
            "filename": "Lab3_Intrusion_Detection_Guide.pdf",
            "course": "CS-401: Network & Systems Security",
            "size": "5.1 MB",
            "uploaded_at": "2026-10-01",
        },
        {
            "id": 3,
            "filename": "ML_Feature_Engineering_Slides.pdf",
            "course": "CS-350: Applied Machine Learning",
            "size": "12.8 MB",
            "uploaded_at": "2026-09-28",
        },
        {
            "id": 4,
            "filename": "Algorithms_Midterm_Review.pdf",
            "course": "CS-210: Data Structures & Algorithms",
            "size": "3.3 MB",
            "uploaded_at": "2026-10-04",
        },
        {
            "id": 5,
            "filename": "Academic_Calendar_Fall2026.pdf",
            "course": "General Student Portal Materials",
            "size": "850 KB",
            "uploaded_at": "2026-08-20",
        },
    ]


@app.get("/api/portal/files/{file_id}/download")
def download_file(file_id: int, user: User = Depends(get_current_user)):
    log_activity(user.id, f"download_file_{file_id}")
    sample_content = (
        f"--- SentryPortal Simulated Course Document (File #{file_id}) ---\n"
        f"Downloaded securely by: {user.full_name or user.username} (Reg No: {user.reg_number or 'N/A'})\n"
        f"Role: {user.role}\n"
        f"Timestamp: Fall 2026 Academic Session\n"
        f"Content: This document was retrieved through the SentryPortal authenticated gateway.\n"
    )
    return Response(
        content=sample_content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="course_document_{file_id}.txt"'},
    )


@app.post("/api/portal/change-password")
def change_password(request: ChangePasswordRequest, user: User = Depends(get_current_user)):
    with SessionLocal() as session:
        db_user = session.get(User, user.id)
        if db_user is None or not verify_password(request.current_password, db_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        db_user.password_hash = hash_password(request.new_password)
        session.commit()
        log_activity(user.id, "change_password", True, db=session)
        return {"message": "Password changed successfully"}


@app.post("/api/portal/failed-login-attempt")
def failed_login_attempt(student_id: int = 1):
    activity = log_activity(student_id=student_id, action="failed_login", success=False)
    conf = getattr(activity, "confidence", 92)
    conf_val = (conf if conf is not None else 92) / 100
    return {
        "id": getattr(activity, "id", 0),
        "classification": getattr(activity, "classification", "suspicious"),
        "confidence": conf_val,
        "message": "Failed login recorded",
    }


@app.post("/api/portal/activity")
def portal_activity(student_id: int = 1, action: str = "other", success: bool = True):
    activity = log_activity(student_id=student_id, action=action, success=success)
    conf = getattr(activity, "confidence", 80)
    conf_val = (conf if conf is not None else 80) / 100
    return {
        "id": getattr(activity, "id", 0),
        "classification": getattr(activity, "classification", "normal"),
        "confidence": conf_val,
    }


# ==========================================
# ADMIN & IDS CONSOLE ROUTES (Protected)
# ==========================================

@app.get("/api/admin/stats")
def admin_stats(admin: User = Depends(get_current_admin_user)):
    with SessionLocal() as session:
        total_activities = session.query(ActivityLog).count()
        suspicious_activities = session.query(ActivityLog).filter(ActivityLog.classification == "suspicious").count()
        normal_activities = session.query(ActivityLog).filter(ActivityLog.classification == "normal").count()
        total_alerts = session.query(Alert).count()
        unacknowledged_alerts = session.query(Alert).filter(Alert.acknowledged == False).count()
        high_critical_alerts = session.query(Alert).filter(Alert.severity.in_(["high", "critical"])).count()
        
        suspicious_logs = session.query(ActivityLog).filter(ActivityLog.classification == "suspicious").all()
        avg_confidence = (
            sum((l.confidence or 92) for l in suspicious_logs) / len(suspicious_logs)
            if suspicious_logs
            else 92.5
        )

        return {
            "total_activities": total_activities,
            "suspicious_activities": suspicious_activities,
            "normal_activities": normal_activities,
            "total_alerts": total_alerts,
            "unacknowledged_alerts": unacknowledged_alerts,
            "high_critical_alerts": high_critical_alerts,
            "avg_anomaly_confidence": round(avg_confidence, 1),
            "ids_status": "ONLINE",
            "model_status": "ACTIVE",
        }


@app.get("/api/admin/alerts")
def admin_alerts(admin: User = Depends(get_current_admin_user)):
    with SessionLocal() as session:
        alerts = session.query(Alert).order_by(Alert.created_at.desc()).all()
        return [
            {
                "id": alert.id,
                "activity_id": alert.activity_id,
                "student_id": alert.student_id,
                "severity": alert.severity or "medium",
                "message": alert.message or "Alert triggered",
                "created_at": alert.created_at.isoformat() if alert.created_at else "",
                "acknowledged": bool(alert.acknowledged),
            }
            for alert in alerts
        ]


@app.post("/api/admin/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, admin: User = Depends(get_current_admin_user)):
    with SessionLocal() as session:
        alert = session.get(Alert, alert_id)
        if alert is None:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.acknowledged = True
        session.commit()
        return {"message": f"Alert #{alert_id} acknowledged successfully", "alert_id": alert_id}


@app.get("/api/admin/activity-logs")
def activity_logs(admin: User = Depends(get_current_admin_user)):
    with SessionLocal() as session:
        logs = session.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(150).all()
        return [
            {
                "id": log.id,
                "student_id": log.student_id,
                "action": log.action or "unknown",
                "success": bool(log.success),
                "timestamp": log.timestamp.isoformat() if log.timestamp else "",
                "classification": log.classification or "normal",
                "confidence": (log.confidence or 80) / 100,
                "details": log.details,
            }
            for log in logs
        ]
