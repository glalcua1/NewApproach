from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
import asyncio
import httpx
from bs4 import BeautifulSoup
import logging

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/hotelrateintel")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="HotelRateIntel API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    hotels = relationship("Hotel", back_populates="owner")

class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    category = Column(String)
    is_own = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="hotels")
    rates = relationship("RateData", back_populates="hotel")

class RateData(Base):
    __tablename__ = "rate_data"
    
    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    date = Column(DateTime)
    source = Column(String)  # booking.com, expedia, etc.
    room_type = Column(String)
    rate = Column(Float)
    availability = Column(Boolean)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    
    hotel = relationship("Hotel", back_populates="rates")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hotel_id = Column(Integer, ForeignKey("hotels.id"))
    name = Column(String)
    condition = Column(String)  # above, below, change
    threshold = Column(Float)
    enabled = Column(Boolean, default=True)
    last_triggered = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime

class HotelCreate(BaseModel):
    name: str
    location: str
    category: str
    is_own: bool = False

class HotelResponse(BaseModel):
    id: int
    name: str
    location: str
    category: str
    is_own: bool
    created_at: datetime

class RateDataResponse(BaseModel):
    id: int
    hotel_id: int
    hotel_name: str
    date: datetime
    source: str
    room_type: str
    rate: float
    availability: bool
    scraped_at: datetime

class AlertCreate(BaseModel):
    hotel_id: int
    name: str
    condition: str
    threshold: float
    enabled: bool = True

class AlertResponse(BaseModel):
    id: int
    hotel_id: int
    name: str
    condition: str
    threshold: float
    enabled: bool
    last_triggered: Optional[datetime]
    created_at: datetime

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth helpers
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# API Routes
@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    db_user = User(email=user.email, hashed_password=hashed_password.decode('utf-8'))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/auth/login")
def login_user(user: UserCreate, db: Session = Depends(get_db)):
    # Find user
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    access_token = create_access_token(data={"sub": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/hotels", response_model=List[HotelResponse])
def get_hotels(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
    return hotels

@app.post("/hotels", response_model=HotelResponse)
def create_hotel(hotel: HotelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_hotel = Hotel(**hotel.dict(), owner_id=current_user.id)
    db.add(db_hotel)
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

@app.get("/rates", response_model=List[RateDataResponse])
def get_rates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rates = db.query(RateData, Hotel.name.label("hotel_name")).join(Hotel).filter(
        Hotel.owner_id == current_user.id
    ).all()
    
    result = []
    for rate, hotel_name in rates:
        rate_dict = {
            "id": rate.id,
            "hotel_id": rate.hotel_id,
            "hotel_name": hotel_name,
            "date": rate.date,
            "source": rate.source,
            "room_type": rate.room_type,
            "rate": rate.rate,
            "availability": rate.availability,
            "scraped_at": rate.scraped_at
        }
        result.append(rate_dict)
    
    return result

@app.get("/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).all()
    return alerts

@app.post("/alerts", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_alert = Alert(**alert.dict(), user_id=current_user.id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 