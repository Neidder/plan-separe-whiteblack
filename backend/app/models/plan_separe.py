from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from app.database import Base

class PlanSepare(Base):
    __tablename__ = "planes_separe"

    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id"))
    total = Column(Float, nullable=False)
    abonado = Column(Float, default=0)
    fecha_limite = Column(Date)