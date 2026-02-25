from pydantic import BaseModel
from datetime import date

class PlanSepareBase(BaseModel):
    producto_id: int
    usuario_id: int
    total: float

class PlanSepareCreate(PlanSepareBase):
    pass

class PlanSepareResponse(PlanSepareBase):
    id: int
    fecha_inicio: date

    class Config:
        from_attributes = True