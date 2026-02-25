from pydantic import BaseModel

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    rol: str

class Config:
    orm_mode = True