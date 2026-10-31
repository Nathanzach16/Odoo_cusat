from fastapi import HTTPException, status, Depends

def require_admin(current_user_role: str = "ADMIN"):
    if current_user_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privileges required."
        )
    return True