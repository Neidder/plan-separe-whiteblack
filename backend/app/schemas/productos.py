from pydantic import BaseModel

class ProductoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio_venta: float
    stock: int
    fecha_creacion: str

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_producto: int
    fecha_creacion: str

    class Config:
        orm_mode = True