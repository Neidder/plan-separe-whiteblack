from  pydantic import BaseModel
from typing import Literal

class PlanSepare(BaseModel):
   product_id: int
   precio_total: float
   anticipo: float

class PlanSepareCreate(PlanSepare):
   pass

class PlanSepareResponse(PlanSepare):
   id: int
   saldo_pendiente: float
   estado: Literal['pendiente', 'pagado', 'cancelado']

   class Config:
      orm_mode = True