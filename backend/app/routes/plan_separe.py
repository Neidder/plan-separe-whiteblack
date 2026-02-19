from fastapi import APIRouter, HTTPException
from schemas.plan_separe import PlanSepareResponse, PlanSepareCreate

router = APIRouter(
    prefix="/plan-separe",
    tags=["plan-separe"]
)

planes_fake_db = []

@router.get("/")
def listar_planes():
    return {
        "message": "Ruta de Plan Separe funcionando correctamente"
    }

@router.post("/", response_model=PlanSepareResponse)
def create_plan_separe(plan: PlanSepareCreate):

    anticipo_minimo = plan.precio_total * 0.2
    if plan.anticipo < anticipo_minimo:
        raise HTTPException(status_code=400, detail=f"El anticipo debe ser al menos el 20% del precio total ({anticipo_minimo})")
    
    saldo = plan.precio_total - plan.anticipo

    nuevo_plan = PlanSepareResponse(
        id=len(planes_fake_db) + 1,
        product_id=plan.product_id,
        precio_total=plan.precio_total,
        anticipo=plan.anticipo,
        saldo_pendiente=saldo,
        estado='activo'
    )
    planes_fake_db.append(nuevo_plan)
    return nuevo_plan