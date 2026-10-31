from typing import Optional
from fastapi import HTTPException, status, Header, Query, Depends


def get_current_user_role(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    current_user_role: Optional[str] = Query(None, alias="current_user_role")
) -> str:
    role = x_user_role or current_user_role or "ADMIN"
    return role.upper()


def require_admin(current_user_role: str = Depends(get_current_user_role)):
    if current_user_role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privileges required."
        )
    return True
