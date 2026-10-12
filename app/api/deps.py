from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.schema_models import User, Role, Permission
from app.schemas.schema_dtos import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role_name: str = payload.get("role")
        permissions: list = payload.get("permissions", [])
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, role=role_name, permissions=permissions)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_user_permissions(user: User) -> list[str]:
    if not user.role or not user.role.permissions:
        return []
    return [p.name for p in user.role.permissions]

def has_permission(required_permission: str):
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_perms = get_user_permissions(current_user)
        if required_permission not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission Denied. Required permission '{required_permission}' is missing for role '{current_user.role.name}'."
            )
        return current_user
    return permission_checker
