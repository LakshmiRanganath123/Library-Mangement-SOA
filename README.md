## Library Management System (SOA) — FastAPI Microservices

This folder contains a self-contained SOA example with four FastAPI microservices. Each service uses its own SQLite DB and runs on a different port.

### Services
- User Service (8001): users CRUD + simple login
- Book Service (8002): books CRUD + availability and stock adjust
- Transaction Service (8003): transactions CRUD + mark return
- Orchestrator Service (8000): coordinates issue/return flows using requests

### Setup (Windows PowerShell)
```powershell
py -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

### Run each service in separate terminals
```powershell
uvicorn library_system.user_service.main:app --host 127.0.0.1 --port 8001 --reload
uvicorn library_system.book_service.main:app --host 127.0.0.1 --port 8002 --reload
uvicorn library_system.transaction_service.main:app --host 127.0.0.1 --port 8003 --reload
uvicorn library_system.orchestrator_service.main:app --host 127.0.0.1 --port 8000 --reload
```

Swagger UIs:
- User: http://127.0.0.1:8001/docs
- Book: http://127.0.0.1:8002/docs
- Transaction: http://127.0.0.1:8003/docs
- Orchestrator: http://127.0.0.1:8000/docs

### Orchestration quick test
```powershell
# Create user
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8001/users -ContentType "application/json" -Body '{"username":"alice","password":"secret"}'
# Create book
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8002/books -ContentType "application/json" -Body '{"title":"Dune","author":"Frank Herbert","available_copies":2}'
# Issue
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/issue-book -ContentType "application/json" -Body '{"user_id":1,"book_id":1}'
# Return
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/return-book -ContentType "application/json" -Body '{"transaction_id":1,"book_id":1}'
```

### Docker Compose (optional)
```powershell
docker compose up --build
```
