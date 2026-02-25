from fastapi import FastAPI
from app.database import Base, engine
from app.routes import productos, auth, plan_separe



app = FastAPI()
app.include_router(productos.router)
app.include_router(auth.router)
app.include_router(plan_separe.router)

@app.get("/")
def root():
    return {"status": "API funcionando"}