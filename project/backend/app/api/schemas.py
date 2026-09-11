from pydantic import BaseModel, EmailStr, Field

from app.models.user import ExpertiseLevel


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    expertise_level: ExpertiseLevel

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class ExpertiseLevelUpdateRequest(BaseModel):
    expertise_level: ExpertiseLevel
