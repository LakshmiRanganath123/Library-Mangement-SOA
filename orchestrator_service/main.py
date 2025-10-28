from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests


app = FastAPI(title="Orchestrator Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IssueRequest(BaseModel):
    user_id: int = Field(gt=0)
    book_id: int = Field(gt=0)


class ReturnRequest(BaseModel):
    transaction_id: int = Field(gt=0)
    book_id: int = Field(gt=0)


# Default service URLs; override via env or config if needed
USER_SERVICE = "http://127.0.0.1:8001"
BOOK_SERVICE = "http://127.0.0.1:8002"
TRANSACTION_SERVICE = "http://127.0.0.1:8003"


@app.post("/issue-book")
def issue_book(payload: IssueRequest):
    # 1) Validate user exists (optional but helpful)
    try:
        user_resp = requests.get(f"{USER_SERVICE}/users/{payload.user_id}", timeout=5)
        if user_resp.status_code != 200:
            raise HTTPException(status_code=404, detail="User not found")
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="User Service unavailable")

    # 2) Check book availability
    try:
        avail_resp = requests.get(f"{BOOK_SERVICE}/books/{payload.book_id}/availability", timeout=5)
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Book Service unavailable")
    if avail_resp.status_code != 200:
        raise HTTPException(status_code=avail_resp.status_code, detail="Book not found")
    avail_data = avail_resp.json()
    if not avail_data.get("is_available"):
        raise HTTPException(status_code=400, detail="Book not available")

    # 3) Create transaction (issued)
    try:
        tx_resp = requests.post(
            f"{TRANSACTION_SERVICE}/transactions",
            json={"user_id": payload.user_id, "book_id": payload.book_id},
            timeout=5,
        )
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Transaction Service unavailable")
    if tx_resp.status_code != 201:
        raise HTTPException(status_code=tx_resp.status_code, detail="Failed to create transaction")
    tx_data = tx_resp.json()

    # 4) Reduce available copies
    try:
        adj_resp = requests.post(f"{BOOK_SERVICE}/books/{payload.book_id}/adjust", params={"delta": -1}, timeout=5)
    except requests.RequestException:
        # Best-effort rollback: mark transaction returned? Simplify by surfacing error
        raise HTTPException(status_code=503, detail="Book Service unavailable for adjust")
    if adj_resp.status_code != 200:
        # In a real system, we would roll back the transaction; here return failure
        raise HTTPException(status_code=400, detail="Failed to adjust book stock")

    return {"message": "issue success", "transaction": tx_data, "book_adjustment": adj_resp.json()}


@app.post("/return-book")
def return_book(payload: ReturnRequest):
    # 1) Mark transaction returned
    try:
        ret_resp = requests.post(f"{TRANSACTION_SERVICE}/transactions/{payload.transaction_id}/return", timeout=5)
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Transaction Service unavailable")
    if ret_resp.status_code != 200:
        raise HTTPException(status_code=ret_resp.status_code, detail="Failed to mark returned")
    tx_data = ret_resp.json()

    # 2) Increase available copies
    try:
        adj_resp = requests.post(f"{BOOK_SERVICE}/books/{payload.book_id}/adjust", params={"delta": 1}, timeout=5)
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Book Service unavailable for adjust")
    if adj_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to increment book stock")

    return {"message": "return success", "transaction": tx_data, "book_adjustment": adj_resp.json()}
