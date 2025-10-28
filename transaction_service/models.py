from sqlalchemy import Column, Integer, String, DateTime, func

from .database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    book_id = Column(Integer, nullable=False, index=True)
    status = Column(String(16), nullable=False, index=True)  # 'issued' or 'returned'
    issued_at = Column(DateTime, nullable=False, server_default=func.now())
    returned_at = Column(DateTime, nullable=True)
