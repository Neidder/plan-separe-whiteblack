from fastapi import APIRouter
from schemas.productos import ProductoCreate, ProductoResponse

router = APIRouter(
    prefix="/productos",
    tags=["productos"]
)

# Simulación de una base de datos 
productos_fake_db = [
  {"id": 1, "nombre": "Producto A", "precio": 10.000, "stock": 100},
    {"id": 2, "nombre": "Producto B", "precio": 20.000, "stock": 50},

 ]

@router.get("/", response_model=list[ProductoResponse])
def listar_productos():
    return productos_fake_db

router.post("/", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate):
    nuevo_producto = {
        "id": len(productos_fake_db) + 1,
        **producto.dict()
    }
    productos_fake_db.append(nuevo_producto)
    return nuevo_producto