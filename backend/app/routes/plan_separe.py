from fastapi import APIRouter, Depends
from app.dependencies import auth_required
from app.database import SessionLocal
from app.models.plan_separe import PlanSepare


router = APIRouter(prefix="/plan_separe", tags=["Plan Separe"])

@router.get("/")
def ver_planes(user=Depends(auth_required)):
    return {
        "message": "Planes del usuario",
        "usuario": user["email"]
    }
@router.post("/")
def crear_plan(producto_id: int, total: float):
    return {"mensaje": "Plan separe creado"}