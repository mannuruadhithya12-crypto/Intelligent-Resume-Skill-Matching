"""
Enhanced Authentication Endpoints with RBAC
Includes user management, role assignment, and company management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import List, Optional
from pydantic import BaseModel

from api.auth_utils import (
    Token, User, UserCreate, UserResponse, UserRole,
    get_user_by_email, create_user_db, verify_password,
    create_access_token, update_last_login, get_all_users,
    create_company, ACCESS_TOKEN_EXPIRE_MINUTES, log_activity,
    update_password_db, pwd_context
)
from api.rbac import (
    get_current_active_user, require_admin,
    require_hr_manager_or_above, get_user_permissions,
    log_user_action
)
from api.history_db import record_login_activity, get_login_activity

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

# --- Models ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.RECRUITER
    company_id: Optional[int] = None

class RoleUpdateRequest(BaseModel):
    email: str
    new_role: UserRole

class CompanyCreate(BaseModel):
    name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserPermissionsResponse(BaseModel):
    email: str
    role: str
    permissions: dict

# --- Authentication Endpoints ---

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company_name: str

# ... (keep existing RegisterRequest) ...

@router.post("/signup", response_model=UserResponse)
async def signup(request: SignupRequest):
    """
    Public Signup Endpoint for Recruiters
    - Creates a new company (or finds existing)
    - Creates a new user with RECRUITER role
    """
    # Check if user already exists
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Handle Company: simple logic - create if new
    # (In a real app, we might want to prevent duplicate names or join existing by domain, 
    # but for this demo, just creating/finding by name is fine)
    # create_company returns ID, or None if exists. If None, we need to fetch it.
    # Actually create_company in auth_utils returns None on integrity error (duplicate).
    
    # Let's try to create.
    company_id = create_company(request.company_name)
    if company_id is None:
        # Company exists, find it (we need a helper for this, or just direct SQL)
        from api.auth_utils import get_db_connection
        conn = get_db_connection()
        c = conn.execute("SELECT id FROM companies WHERE name = ?", (request.company_name,))
        row = c.fetchone()
        conn.close()
        if row:
            company_id = row['id']
        else:
            # Should not happen
            company_id = None

    # Create user
    user_create = UserCreate(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=UserRole.RECRUITER,
        company_id=company_id
    )
    
    success = create_user_db(user_create)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Log activity
    log_activity(request.email, "SIGNUP", f"New recruiter signup for {request.company_name}")
    
    return UserResponse(
        email=request.email,
        full_name=request.full_name,
        role=UserRole.RECRUITER.value,
        company_id=company_id,
        disabled=False
    )

@router.post("/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    current_user: User = Depends(require_admin)
):
    """
    Register a new user (Admin only)
    
    **Required Role:** Admin
    
    **Permissions:**
    - Only admins can create new users
    - Can assign any role
    - Can assign to any company
    """
    # Check if user already exists
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_create = UserCreate(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        role=request.role,
        company_id=request.company_id
    )
    
    success = create_user_db(user_create)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Log activity
    log_user_action(
        current_user,
        "USER_CREATED",
        f"Created user: {request.email} with role: {request.role.value}"
    )
    
    return UserResponse(
        email=request.email,
        full_name=request.full_name,
        role=request.role.value,
        company_id=request.company_id,
        disabled=False
    )


@router.post("/token", response_model=Token)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint - Returns JWT token
    
    **Authentication Flow:**
    1. Validate email and password
    2. Generate JWT token
    3. Return token with user info
    
    **Token includes:**
    - User email (sub)
    - Role
    - Company ID
    - Expiration time
    """
    user = get_user_by_email(form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role.value,
            "company_id": user.company_id
        },
        expires_delta=access_token_expires
    )
    
    # Update last login
    update_last_login(user.email)
    
    # Log activity
    log_activity(user.email, "LOGIN", "User logged in successfully")
    
    # Record detailed login history
    record_login_activity(
        user_email=user.email,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "Unknown"),
        location="Unknown" # Would need GeoIP for this
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information
    
    **Returns:**
    - Email
    - Full name
    - Role
    - Company ID
    - Status
    """
    return UserResponse(
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        company_id=current_user.company_id,
        disabled=current_user.disabled
    )

@router.get("/me/permissions", response_model=UserPermissionsResponse)
async def get_my_permissions(current_user: User = Depends(get_current_active_user)):
    """
    Get current user's permissions
    
    **Returns all permissions for the user's role:**
    - can_create_users
    - can_delete_users
    - can_view_analytics
    - can_analyze_resumes
    - can_export_data
    - etc.
    """
    permissions = get_user_permissions(current_user)
    
    return UserPermissionsResponse(
        email=current_user.email,
        role=current_user.role.value,
        permissions=permissions
    )

    return UserPermissionsResponse(
        email=current_user.email,
        role=current_user.role.value,
        permissions=permissions
    )

@router.get("/activity")
async def get_my_activity(current_user: User = Depends(get_current_active_user)):
    """Get my recent login activity"""
    return get_login_activity(current_user.email)

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Change user password"""
    user_in_db = get_user_by_email(current_user.email)
    if not verify_password(request.current_password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    hashed_password = pwd_context.hash(request.new_password)
    updated = update_password_db(current_user.email, hashed_password)
    
    if not updated:
         raise HTTPException(status_code=500, detail="Failed to update password")

    log_activity(current_user.email, "PASSWORD_CHANGE", "User changed password")
    
    return {"message": "Password updated successfully"}

# --- User Management (Admin/HR Manager) ---

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(require_hr_manager_or_above)
):
    """
    List all users
    
    **Required Role:** HR Manager or Admin
    
    **Behavior:**
    - Admins see all users across all companies
    - HR Managers see only users from their company
    """
    # Admins can see all users
    if current_user.role == UserRole.ADMIN:
        company_id = None
    else:
        # HR Managers see only their company
        company_id = current_user.company_id
    
    users = get_all_users(company_id)
    return users

@router.put("/users/role", response_model=UserResponse)
async def update_user_role(
    request: RoleUpdateRequest,
    current_user: User = Depends(require_admin)
):
    """
    Update user role (Admin only)
    
    **Required Role:** Admin
    
    **Allowed role changes:**
    - Admin can change any user to any role
    - Cannot change own role
    """
    # Prevent self-role change
    if request.email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Get target user
    target_user = get_user_by_email(request.email)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update role in database
    from api.auth_utils import get_db_connection
    conn = get_db_connection()
    conn.execute(
        'UPDATE users SET role = ? WHERE email = ?',
        (request.new_role.value, request.email)
    )
    conn.commit()
    conn.close()
    
    # Log activity
    log_user_action(
        current_user,
        "ROLE_UPDATED",
        f"Changed {request.email} role to {request.new_role.value}"
    )
    
    # Return updated user
    updated_user = get_user_by_email(request.email)
    return UserResponse(
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role.value,
        company_id=updated_user.company_id,
        disabled=updated_user.disabled
    )

# --- Company Management (Admin only) ---

@router.post("/companies", response_model=dict)
async def create_new_company(
    company: CompanyCreate,
    current_user: User = Depends(require_admin)
):
    """
    Create a new company (Admin only)
    
    **Required Role:** Admin
    
    **Returns:**
    - Company ID
    - Company name
    """
    company_id = create_company(company.name)
    
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name already exists"
        )
    
    # Log activity
    log_user_action(
        current_user,
        "COMPANY_CREATED",
        f"Created company: {company.name} (ID: {company_id})"
    )
    
    return {
        "company_id": company_id,
        "name": company.name,
        "message": "Company created successfully"
    }

@router.get("/companies", response_model=List[dict])
async def list_companies(current_user: User = Depends(require_admin)):
    """
    List all companies (Admin only)
    
    **Required Role:** Admin
    """
    from api.auth_utils import get_db_connection
    
    conn = get_db_connection()
    companies = conn.execute(
        'SELECT id, name, created_at, active FROM companies ORDER BY name'
    ).fetchall()
    conn.close()
    
    return [
        {
            "id": c['id'],
            "name": c['name'],
            "created_at": c['created_at'],
            "active": bool(c['active'])
        }
        for c in companies
    ]

# --- Role Information ---

@router.get("/roles", response_model=List[dict])
async def list_roles():
    """
    List all available roles and their permissions
    
    **Public endpoint** - No authentication required
    
    **Returns:**
    - Role name
    - Role description
    - Permissions
    """
    from api.auth_utils import ROLE_PERMISSIONS
    
    role_descriptions = {
        UserRole.ADMIN: "Full system access with user and company management",
        UserRole.HR_MANAGER: "Can analyze resumes, view analytics, and export data",
        UserRole.RECRUITER: "Can analyze resumes and view results",
        UserRole.VIEWER: "Read-only access to view results"
    }
    
    return [
        {
            "role": role.value,
            "description": role_descriptions.get(role, ""),
            "permissions": ROLE_PERMISSIONS.get(role, {})
        }
        for role in UserRole
    ]

# --- Google Authentication ---

from api.schemas_auth import GoogleLoginRequest
from jose import jwt

@router.post("/google", response_model=Token)
async def google_login(request: GoogleLoginRequest):
    """
    Google Login endpoint
    """
    try:
        # DEMO Mode: Decode without verification
        decoded = jwt.get_unverified_claims(request.token)
        
        email = decoded.get('email')
        name = decoded.get('name')
        
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token")
            
        # Check if user exists
        user = get_user_by_email(email)
        if not user:
            # Create user automatically
            new_user = UserCreate(email=email, password=None, full_name=name)
            # Use direct DB insertion to handle provider field
            conn = get_db_connection()
            conn.execute(
                "INSERT INTO users (email, hashed_password, full_name, provider) VALUES (?, ?, ?, 'google')",
                (email, "oauth_user", name)
            )
            conn.commit()
            conn.close()
            
            # Fetch the newly created user to get their role/company (which will be default)
            user = get_user_by_email(email)
            
        if user.disabled:
             raise HTTPException(status_code=403, detail="Account disabled")
            
        # Create Access Token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.role.value,
                "company_id": user.company_id
            },
            expires_delta=access_token_expires
        )
        
        # Log activity
        log_activity(user.email, "LOGIN_GOOGLE", "User logged in via Google")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.role.value,
            full_name=user.full_name
        )
        
    except Exception as e:
        print(f"Google Auth Error: {e}")
        raise HTTPException(status_code=400, detail="Google Authentication Failed")

