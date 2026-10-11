# Employee Management System

A full-stack employee management app with login and logout: a React dashboard and directory backed by a Flask REST API and a SQLite database.

## Features
- Login and logout with password hashing and signed, expiring tokens
- Dashboard with total employees, total departments, average salary and a department bar chart
- Employee directory with search (name or ID) and department filter
- Add, edit and delete employees, with a confirmation dialog before deleting
- Validation on the frontend and backend (required fields, email format, non-negative salary, duplicate emails)
- Loading indicators, success messages, readable errors and empty states
- Responsive layout for desktop and mobile

## Tech Stack
React + Vite (JavaScript, plain CSS) | Python Flask | SQLite | REST APIs with `fetch()`

## Setup (Windows 11)

Backend:
```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Frontend (second terminal):
```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the demo account **admin / admin123**.
The API runs at http://127.0.0.1:5000. The SQLite file is created automatically on first run and seeded with 10 sample employees and the demo admin user.

## Authentication
- Passwords are stored as salted hashes (Werkzeug), never as plain text.
- `POST /api/auth/login` returns a signed token (itsdangerous, valid for 8 hours). The frontend keeps it in `localStorage` and sends it as `Authorization: Bearer <token>` on every request.
- All `/api/employees` and `/api/dashboard` endpoints return `401` without a valid token, and the frontend then returns to the login page.
- Logout calls `POST /api/auth/logout` and deletes the token in the browser. Tokens are stateless, so a copied token stays valid until it expires.
- Before real use, set your own signing key: `$env:EMS_SECRET_KEY = "a-long-random-string"` in the backend terminal before `python app.py`, and change the demo password.

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Log in, returns token and user |
| POST | `/api/auth/logout` | Yes | Log out |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/employees?search=&department=` | Yes | List employees (optional search and filter) |
| GET | `/api/employees/<id>` | Yes | Get one employee |
| POST | `/api/employees` | Yes | Create an employee |
| PUT | `/api/employees/<id>` | Yes | Update an employee |
| DELETE | `/api/employees/<id>` | Yes | Delete an employee |
| GET | `/api/dashboard` | Yes | Totals, average salary, count by department |

Responses are shaped like `{ "success": true, "data": ... }` or `{ "success": false, "error": "...", "errors": { "field": "..." } }`.

## Upload to GitHub
```powershell
git init
git add .
git commit -m "Initial commit: Employee Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/employee-management-system.git
git push -u origin main
```
Create the empty repository on github.com first. `.gitignore` already excludes `venv/`, `node_modules/` and the `.db` file.
