from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import Role, Permission, User
from app.schemas.schema_dtos import RoleDTO, PermissionDTO
from app.api.deps import get_current_user, has_permission

router = APIRouter()

@router.get("/roles", response_model=List[RoleDTO])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("roles:manage"))
):
    roles = db.query(Role).all()
    result = []
    for r in roles:
        result.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "permissions": [p.name for p in r.permissions]
        })
    return result

@router.get("/permissions", response_model=List[PermissionDTO])
def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Permission).all()
