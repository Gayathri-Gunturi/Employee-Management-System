import os
import sqlite3
from contextlib import closing

from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "employees.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")

# Demo account created only when the users table is empty.
DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"

SAMPLE_EMPLOYEES = [
    ("Aarav Sharma", "aarav.sharma@example.com", "Engineering", "Software Engineer", 1200000, "2021-06-14"),
    ("Priya Nair", "priya.nair@example.com", "Engineering", "Senior Backend Developer", 1800000, "2019-03-01"),
    ("Rohan Mehta", "rohan.mehta@example.com", "Sales", "Sales Manager", 1400000, "2020-01-20"),
    ("Ananya Reddy", "ananya.reddy@example.com", "Human Resources", "HR Executive", 750000, "2022-08-08"),
    ("Karthik Iyer", "karthik.iyer@example.com", "Finance", "Financial Analyst", 950000, "2021-11-15"),
    ("Sneha Kapoor", "sneha.kapoor@example.com", "Marketing", "Marketing Specialist", 820000, "2023-02-06"),
    ("Vikram Singh", "vikram.singh@example.com", "Engineering", "DevOps Engineer", 1300000, "2020-09-28"),
    ("Meera Joshi", "meera.joshi@example.com", "Design", "UI/UX Designer", 900000, "2022-04-18"),
    ("Arjun Patel", "arjun.patel@example.com", "Operations", "Operations Lead", 1100000, "2018-12-03"),
    ("Divya Menon", "divya.menon@example.com", "Finance", "Accountant", 700000, "2023-07-24"),
]


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the table if needed and insert sample data only when it is empty."""
    with closing(get_connection()) as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        count = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO employees (full_name, email, department, job_title, salary, joining_date) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                SAMPLE_EMPLOYEES,
            )
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if user_count == 0:
            conn.execute(
                "INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)",
                (DEFAULT_ADMIN_USERNAME, generate_password_hash(DEFAULT_ADMIN_PASSWORD), "Administrator"),
            )
        conn.commit()


def query_all(sql, params=()):
    with closing(get_connection()) as conn:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]


def query_one(sql, params=()):
    with closing(get_connection()) as conn:
        row = conn.execute(sql, params).fetchone()
        return dict(row) if row else None


def execute(sql, params=()):
    """Run an INSERT/UPDATE/DELETE. Returns (last_row_id, rows_affected)."""
    with closing(get_connection()) as conn:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid, cur.rowcount
