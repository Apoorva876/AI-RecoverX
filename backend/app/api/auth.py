from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.db.mongo import db, seed_demo_user
from app.models.schemas import UserCreate, UserLogin, UserResponse
from app.core.config import settings

router = APIRouter()


def hash_password(password: str) -> str:
    import bcrypt

    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    import bcrypt

    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(subject: str, minutes: int = 15):
    import jwt

    payload = {
        "sub": subject,
        "exp": datetime.utcnow() + timedelta(minutes=minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/register")
async def register(payload: UserCreate):
    await seed_demo_user()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user_doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": "investigator",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.users.insert_one(user_doc)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "user": {
                "id": str(result.inserted_id),
                "name": payload.name,
                "email": payload.email.lower(),
                "role": "investigator",
            },
            "access_token": create_token(str(result.inserted_id)),
            "refresh_token": create_token(str(result.inserted_id), minutes=60 * 24 * 7),
        },
    )


@router.post("/login")
async def login(payload: UserLogin):
    await seed_demo_user()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "investigator"),
        },
        "access_token": create_token(str(user["_id"])),
        "refresh_token": create_token(str(user["_id"]), minutes=60 * 24 * 7),
    }


@router.post("/refresh")
async def refresh():
    return {"message": "refresh token endpoint ready"}


@router.post("/logout")
async def logout():
    return {"message": "logged out"}
