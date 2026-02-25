from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    precio_venta = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    fecha_creacion = Column(String(20))