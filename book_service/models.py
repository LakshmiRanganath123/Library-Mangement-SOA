from sqlalchemy import Column, Integer, String

from .database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    author = Column(String(120), nullable=False, index=True)
    available_copies = Column(Integer, nullable=False, default=0)
