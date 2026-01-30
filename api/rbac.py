"""
Role-Based Access Control (RBAC) Middleware
Provides decorators and dependencies for protecting API endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import List, Optional
from api.auth_utils import (
    SECRET_KEY, ALGORITHM, UserRole, User, get_user_by_email,
    check_permission, ROLE_PERMISSIONS
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(username)
    if user is None:
        raise credentials_exception
    
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active (not disabled)
    """
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# --- Role-Based Dependencies ---

async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to require Admin role
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def require_hr_manager_or_above(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to require HR Manager or Admin role
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR Manager or Admin access required"
        )
    return current_user

async def require_recruiter_or_above(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to require Recruiter, HR Manager, or Admin role
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.RECRUITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access or above required"
        )
    return current_user

# --- Permission-Based Dependencies ---

def require_permission(permission: str):
    """
    Factory function to create permission-based dependencies
    
    Usage:
        @app.get("/endpoint", dependencies=[Depends(require_permission("can_view_analytics"))])
    """
    async def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if not check_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        return current_user
    
    return permission_checker

# --- Company Isolation ---

async def get_user_company_id(
    current_user: User = Depends(get_current_active_user)
) -> Optional[int]:
    """
    Get the company ID of the current user
    Admins can access all companies (returns None)
    """
    if current_user.role == UserRole.ADMIN:
        return None  # Admin can access all companies
    return current_user.company_id

def require_same_company(resource_company_id: int):
    """
    Ensure user belongs to the same company as the resource
    """
    async def company_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        # Admins can access all companies
        if current_user.role == UserRole.ADMIN:
            return current_user
        
        # Check if user belongs to the same company
        if current_user.company_id != resource_company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Resource belongs to different company"
            )
        
        return current_user
    
    return company_checker

# --- Helper Functions ---

def get_user_permissions(user: User) -> dict:
    """
    Get all permissions for a user based on their role
    """
    return ROLE_PERMISSIONS.get(user.role, {})

def can_user_access_resource(user: User, resource_company_id: Optional[int]) -> bool:
    """
    Check if user can access a resource from a specific company
    """
    # Admins can access everything
    if user.role == UserRole.ADMIN:
        return True
    
    # Users can only access resources from their own company
    return user.company_id == resource_company_id

# --- Audit Logging ---

from api.auth_utils import log_activity

def log_user_action(user: User, action: str, details: str = ""):
    """
    Log user action for audit trail
    """
    try:
        log_activity(user.email, action, details)
    except Exception as e:
        print(f"Failed to log activity: {e}")
