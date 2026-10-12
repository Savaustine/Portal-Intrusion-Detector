from app.core import database
from app.models.activity import ActivityLog


def register_payload(reg_number="STU/2026/101", full_name="Johnathan Doe", role="student"):
    return {
        "reg_number": reg_number,
        "full_name": full_name,
        "email": f"{reg_number.lower().replace('/', '_')}@school.edu",
        "password": "correct-horse",
        "role": role,
    }


def test_register_and_login_returns_valid_jwt(client):
    response = client.post("/api/auth/register", json=register_payload(reg_number="STU/2026/888", full_name="Jane Doe"))
    assert response.status_code == 200

    response = client.post("/api/auth/login", json={"reg_number": "STU/2026/888", "password": "correct-horse"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"].split(".")) == 3
    assert body["user"]["reg_number"] == "STU/2026/888"
    assert body["user"]["full_name"] == "Jane Doe"
    assert body["user"]["role"] == "student"


def test_protected_route_rejects_unauthenticated_requests(client):
    response = client.get("/api/portal/dashboard")
    assert response.status_code == 401


def test_faculty_lookup_student_and_upload_grade(client):
    # Register student
    client.post("/api/auth/register", json=register_payload(reg_number="STU/2026/300", full_name="Emily Davis", role="student"))

    # Register & Login Faculty
    client.post("/api/auth/register", json=register_payload(reg_number="FAC/2026/555", full_name="Prof. Williams", role="faculty"))
    fac_login = client.post("/api/auth/login", json={"reg_number": "FAC/2026/555", "password": "correct-horse"}).json()
    fac_token = fac_login["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # Faculty looks up student by reg_number
    lookup_res = client.get("/api/portal/students/lookup/STU/2026/300", headers=fac_headers)
    assert lookup_res.status_code == 200
    student_data = lookup_res.json()
    assert student_data["found"] is True
    assert student_data["full_name"] == "Emily Davis"
    assert student_data["reg_number"] == "STU/2026/300"

    # Faculty uploads grade for Emily Davis
    grade_res = client.post(
        "/api/portal/grades/upload",
        json={
            "reg_number": "STU/2026/300",
            "course_code": "CS-500",
            "course_name": "Distributed Systems",
            "grade": "A",
            "credits": 4,
            "semester": "Fall 2026",
        },
        headers=fac_headers,
    )
    assert grade_res.status_code == 200
    assert grade_res.json()["grade"]["course_code"] == "CS-500"

    # Login as student Emily and verify grades
    stu_login = client.post("/api/auth/login", json={"reg_number": "STU/2026/300", "password": "correct-horse"}).json()
    stu_token = stu_login["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    grades_res = client.get("/api/portal/grades", headers=stu_headers)
    assert grades_res.status_code == 200
    grades_list = grades_res.json()
    assert any(g["course_code"] == "CS-500" and g["grade"] == "A" for g in grades_list)


def test_portal_action_creates_activity_log_row(client):
    response = client.post("/api/portal/activity?student_id=42&action=view_grades")
    assert response.status_code == 200
    assert response.json()["classification"] == "normal"

    with database.SessionLocal() as session:
        activity = session.query(ActivityLog).filter_by(student_id=42, action="view_grades").one()
        assert activity.classification == "normal"


def test_failed_login_burst_is_suspicious(client):
    # Register and login admin
    client.post("/api/auth/register", json=register_payload(reg_number="ADM/2026/007", full_name="Admin SOC", role="admin"))
    login_res = client.post("/api/auth/login", json={"reg_number": "ADM/2026/007", "password": "correct-horse"}).json()
    admin_token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    results = [client.post("/api/portal/failed-login-attempt?student_id=43").json() for _ in range(5)]
    assert any(result["classification"] == "suspicious" for result in results)
    
    alerts_res = client.get("/api/admin/alerts", headers=headers)
    assert alerts_res.status_code == 200
    assert len(alerts_res.json()) > 0


def test_admin_route_forbidden_for_student(client):
    # Register and login as regular student
    client.post("/api/auth/register", json=register_payload(reg_number="STU/2026/777", full_name="Student Bob", role="student"))
    login_res = client.post("/api/auth/login", json={"reg_number": "STU/2026/777", "password": "correct-horse"}).json()
    student_token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {student_token}"}

    # Student should be forbidden (403) from accessing admin alerts or stats
    alerts_res = client.get("/api/admin/alerts", headers=headers)
    assert alerts_res.status_code == 403

    stats_res = client.get("/api/admin/stats", headers=headers)
    assert stats_res.status_code == 403