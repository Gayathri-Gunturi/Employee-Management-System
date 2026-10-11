import math
import os
import re
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from itsdangerous import BadSignature, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from database import execute, init_db, query_all, query_one

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

init_db()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
COLUMNS = "id, full_name, email, department, job_title, salary, joining_date"

# Used to sign login tokens. Set EMS_SECRET_KEY in your environment for real use.
SECRET_KEY = os.environ.get("EMS_SECRET_KEY", "dev-only-change-this-secret")
TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60  # tokens expire after 8 hours
token_serializer = URLSafeTimedSerializer(SECRET_KEY, salt="ems-auth")
DUMMY_HASH = generate_password_hash("not-a-real-password")


def ok(data, status=200):
    return jsonify({"success": True, "data": data}), status


def fail(message, status, errors=None):
    return jsonify({"success": False, "error": message, "errors": errors or {}}), status


def current_user():
    """Return the logged-in user from the Authorization header, or None."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        payload = token_serializer.loads(header[7:], max_age=TOKEN_MAX_AGE_SECONDS)
        user_id = payload["user_id"]
    except (BadSignature, KeyError, TypeError):
        return None
    return query_one("SELECT id, username, full_name FROM users WHERE id = ?", (user_id,))


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None:
            return fail("Authentication required. Please log in.", 401)
        g.current_user = user
        return view(*args, **kwargs)

    return wrapper


def validate_employee(data):
    """Return (clean_data, errors). errors is a dict of field -> message."""
    errors, clean = {}, {}

    for field, label in [("full_name", "Full name"), ("department", "Department"), ("job_title", "Job title")]:
        value = data.get(field)
        value = value.strip() if isinstance(value, str) else ""
        if not value:
            errors[field] = f"{label} is required."
        elif len(value) > 100:
            errors[field] = f"{label} must be 100 characters or fewer."
        else:
            clean[field] = value

    email = data.get("email")
    email = email.strip().lower() if isinstance(email, str) else ""
    if not email:
        errors["email"] = "Email is required."
    elif len(email) > 120 or not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email address."
    else:
        clean["email"] = email

    salary = data.get("salary")
    if salary is None or (isinstance(salary, str) and not salary.strip()):
        errors["salary"] = "Salary is required."
    else:
        try:
            if isinstance(salary, bool):
                raise ValueError
            salary = float(salary)
            if not math.isfinite(salary):
                raise ValueError
            if salary < 0:
                errors["salary"] = "Salary cannot be negative."
            else:
                clean["salary"] = round(salary, 2)
        except (ValueError, TypeError):
            errors["salary"] = "Salary must be a number."

    joining_date = data.get("joining_date")
    joining_date = joining_date.strip() if isinstance(joining_date, str) else ""
    if not joining_date:
        errors["joining_date"] = "Joining date is required."
    else:
        try:
            datetime.strptime(joining_date, "%Y-%m-%d")
            clean["joining_date"] = joining_date
        except ValueError:
            errors["joining_date"] = "Joining date must be a valid date (YYYY-MM-DD)."

    return clean, errors


def employee_values(clean):
    return (
        clean["full_name"],
        clean["email"],
        clean["department"],
        clean["job_title"],
        clean["salary"],
        clean["joining_date"],
    )


@app.get("/api/health")
def health():
    return ok({"status": "ok"})


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return fail("Request body must be valid JSON.", 400)

    username = data.get("username")
    username = username.strip().lower() if isinstance(username, str) else ""
    password = data.get("password")
    password = password if isinstance(password, str) else ""

    errors = {}
    if not username:
        errors["username"] = "Username is required."
    if not password:
        errors["password"] = "Password is required."
    if errors:
        return fail("Validation failed.", 400, errors)

    user = query_one("SELECT id, username, full_name, password_hash FROM users WHERE username = ?", (username,))
    # Always run a hash check so response time does not reveal whether the username exists.
    password_ok = check_password_hash(user["password_hash"] if user else DUMMY_HASH, password)
    if user is None or not password_ok:
        return fail("Invalid username or password.", 401)

    token = token_serializer.dumps({"user_id": user["id"]})
    return ok(
        {
            "token": token,
            "user": {"id": user["id"], "username": user["username"], "full_name": user["full_name"]},
        }
    )


@app.post("/api/auth/logout")
@login_required
def logout():
    # Tokens are stateless; the client discards its token. Endpoint exists so logout is an explicit API action.
    return ok({"message": "Logged out successfully."})


@app.get("/api/auth/me")
@login_required
def me():
    return ok(g.current_user)


@app.get("/api/employees")
@login_required
def list_employees():
    search = request.args.get("search", "").strip()
    department = request.args.get("department", "").strip()

    sql = f"SELECT {COLUMNS} FROM employees WHERE 1=1"
    params = []
    if search:
        if search.isdigit():
            sql += " AND (id = ? OR full_name LIKE ?)"
            params += [int(search), f"%{search}%"]
        else:
            sql += " AND full_name LIKE ?"
            params.append(f"%{search}%")
    if department:
        sql += " AND department = ?"
        params.append(department)
    sql += " ORDER BY id"
    return ok(query_all(sql, params))


@app.get("/api/employees/<int:employee_id>")
@login_required
def get_employee(employee_id):
    employee = query_one(f"SELECT {COLUMNS} FROM employees WHERE id = ?", (employee_id,))
    if employee is None:
        return fail("Employee not found.", 404)
    return ok(employee)


@app.post("/api/employees")
@login_required
def create_employee():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return fail("Request body must be valid JSON.", 400)

    clean, errors = validate_employee(data)
    if errors:
        return fail("Validation failed.", 400, errors)

    try:
        new_id, _ = execute(
            "INSERT INTO employees (full_name, email, department, job_title, salary, joining_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            employee_values(clean),
        )
    except sqlite3.IntegrityError:
        return fail("Validation failed.", 409, {"email": "An employee with this email already exists."})

    employee = query_one(f"SELECT {COLUMNS} FROM employees WHERE id = ?", (new_id,))
    return ok(employee, 201)


@app.put("/api/employees/<int:employee_id>")
@login_required
def update_employee(employee_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return fail("Request body must be valid JSON.", 400)

    if query_one("SELECT id FROM employees WHERE id = ?", (employee_id,)) is None:
        return fail("Employee not found.", 404)

    clean, errors = validate_employee(data)
    if errors:
        return fail("Validation failed.", 400, errors)

    try:
        execute(
            "UPDATE employees SET full_name = ?, email = ?, department = ?, job_title = ?, "
            "salary = ?, joining_date = ? WHERE id = ?",
            employee_values(clean) + (employee_id,),
        )
    except sqlite3.IntegrityError:
        return fail("Validation failed.", 409, {"email": "An employee with this email already exists."})

    employee = query_one(f"SELECT {COLUMNS} FROM employees WHERE id = ?", (employee_id,))
    return ok(employee)


@app.delete("/api/employees/<int:employee_id>")
@login_required
def delete_employee(employee_id):
    _, deleted = execute("DELETE FROM employees WHERE id = ?", (employee_id,))
    if deleted == 0:
        return fail("Employee not found.", 404)
    return ok({"id": employee_id})


@app.get("/api/dashboard")
@login_required
def dashboard():
    stats = query_one(
        "SELECT COUNT(*) AS total_employees, "
        "COUNT(DISTINCT department) AS total_departments, "
        "COALESCE(AVG(salary), 0) AS average_salary FROM employees"
    )
    by_department = query_all(
        "SELECT department, COUNT(*) AS count FROM employees "
        "GROUP BY department ORDER BY count DESC, department"
    )
    return ok(
        {
            "total_employees": stats["total_employees"],
            "total_departments": stats["total_departments"],
            "average_salary": round(stats["average_salary"], 2),
            "by_department": by_department,
        }
    )


@app.errorhandler(404)
def not_found(_):
    return fail("Resource not found.", 404)


@app.errorhandler(405)
def method_not_allowed(_):
    return fail("Method not allowed.", 405)


@app.errorhandler(sqlite3.Error)
def database_error(_):
    return fail("A database error occurred. Please try again.", 500)


@app.errorhandler(500)
def server_error(_):
    return fail("Internal server error.", 500)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
