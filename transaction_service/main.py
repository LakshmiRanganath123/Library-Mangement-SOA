from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Transaction


app = FastAPI(title="Transaction Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


class TransactionCreate(BaseModel):
    user_id: int = Field(gt=0)
    book_id: int = Field(gt=0)


class TransactionUpdate(BaseModel):
    status: str | None = None


class TransactionRead(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    issued_at: datetime | None
    returned_at: datetime | None

    class Config:
        orm_mode = True


@app.post("/transactions", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    tx = Transaction(user_id=payload.user_id, book_id=payload.book_id, status="issued")
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@app.get("/transactions", response_model=list[TransactionRead])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()


@app.get("/transactions/{tx_id}", response_model=TransactionRead)
def get_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@app.put("/transactions/{tx_id}", response_model=TransactionRead)
def update_transaction(tx_id: int, payload: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if payload.status is not None:
        if payload.status not in {"issued", "returned"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        if payload.status == "returned" and tx.status != "returned":
            tx.status = "returned"
            tx.returned_at = datetime.utcnow()
        else:
            tx.status = payload.status
    db.commit()
    db.refresh(tx)
    return tx


@app.post("/transactions/{tx_id}/return", response_model=TransactionRead)
def mark_returned(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.status == "returned":
        return tx
    tx.status = "returned"
    tx.returned_at = datetime.utcnow()
    db.commit()
    db.refresh(tx)
    return tx
