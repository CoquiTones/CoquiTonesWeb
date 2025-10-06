from typing import Annotated

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import status
from fastapi import Depends, HTTPException, status, APIRouter, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, SecretStr
from jwt.exceptions import InvalidTokenError

from dbutil import get_db_connection
import hashlib
import dao
import os


router = APIRouter()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
    auid: int | None = None


# Class for User without hash and salt
class LightWeightUser(BaseModel):
    username: str
    auid: int


def hash_password(password: SecretStr, salt: bytes) -> bytes:
    return hashlib.scrypt(bytes(password.get_secret_value(), "utf8"), salt=salt, n=16384, r=8, p=1)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    secret_key = os.environ["SECRET_KEY"]
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> LightWeightUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, os.environ["SECRET_KEY"], algorithms=[ALGORITHM])
        (_, _, username) = payload.get("sub").partition(":")
        auid = payload.get("auid")
    except InvalidTokenError:
        raise credentials_exception
    
    user = LightWeightUser(username=username, auid=auid)

    if not user:
        raise credentials_exception
    return user

def validate_username(username: str) -> bool:
    #TODO
    return True

async def authenticate_user(submitted_username: str, submitted_password: SecretStr, db) -> dao.User | None:
    if not validate_username(submitted_username):
        return None
    # Get user referenced by that name
    user: dao.User | None = await dao.User.get_by_username(db, submitted_username) # type: ignore
    # Return early if that username is not in db
    if not user:
        return None
        
    # Check the password
    hashed_password = hash_password(submitted_password, user.salt)
    if not hashed_password == bytes(user.pwhash): # TODO: refactor hash comparison, it should use a cryptographically secure bytestring comparison to avoid timing attacks 
        return None 
    
    return user

@router.post("/api/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db=Depends(get_db_connection)
) -> Token:
    
    user = await authenticate_user(form_data.username, SecretStr(form_data.password), db)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={
        "sub": f"username:{user.username}",
        "auid": user.auid
    }, expires_delta=access_token_expires)

    return Token(access_token=access_token, token_type="bearer")


@router.get("/api/users/me")
async def read_users_me(
    current_user: Annotated[LightWeightUser, Depends(get_current_user)],
):
    return current_user

@router.post("/api/createuser/")
async def create_user(
    username: Annotated[str, Form()],
    password: Annotated[SecretStr, Form()],
    db=Depends(get_db_connection)
):
    if len(username) > 30:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username too long")
    salt = os.urandom(16)
    pwhash = hash_password(password, salt)
    if await dao.User.insert(db, username, pwhash, salt) is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username taken")

