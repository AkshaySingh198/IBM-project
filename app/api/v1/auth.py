import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.schema_models import User, Role
from app.schemas.schema_dtos import Token, UserDTO, RegisterRequest
from app.api.deps import get_current_user, get_user_permissions
from app.services.audit_service import create_audit_entry

router = APIRouter()

@router.post("/register", response_model=UserDTO, status_code=status.HTTP_201_CREATED)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
        
    role = db.query(Role).filter(Role.name == request.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Invalid role name '{request.role_name}'. Available: Analyst, SeniorInvestigator, Auditor, Admin, ServiceAccount")
        
    user_id = f"user_{uuid.uuid4().hex[:8]}"
    new_user = User(
        id=user_id,
        username=request.username,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        role_id=role.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    create_audit_entry(
        db=db,
        actor_id=new_user.id,
        action_type="USER_REGISTER",
        target_id=new_user.id
    )
    
    permissions = [p.name for p in new_user.role.permissions]
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role_id": new_user.role_id,
        "role_name": new_user.role.name,
        "permissions": permissions,
        "created_at": new_user.created_at
    }

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    
    # Support both Swagger UI form submission (application/x-www-form-urlencoded) and JSON
    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        login_id = form.get("username")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            login_id = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    if not login_id or not password:
        raise HTTPException(status_code=400, detail="Email/Username and password are required.")

    # Allow login with either Email or Username
    user = db.query(User).filter((User.email == login_id) | (User.username == login_id)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    permissions = get_user_permissions(user)
    access_token = create_access_token(
        subject=user.id,
        role=user.role.name,
        expires_delta=None
    )
    
    create_audit_entry(
        db=db,
        actor_id=user.id,
        action_type="LOGIN",
        target_id=user.id
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role.name,
        "permissions": permissions
    }

@router.get("/me", response_model=UserDTO)
def read_current_user(current_user: User = Depends(get_current_user)):
    permissions = get_user_permissions(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "role_name": current_user.role.name,
        "permissions": permissions,
        "created_at": current_user.created_at
    }
