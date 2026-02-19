from fastapi import FastAPI
from routes import productos , plan_separe

app = FastAPI(title="API de Gestión de Productos y Planes Separe", version="1.0")

app.include_router(productos.router)
app.include_router(plan_separe.router)

@app.get("/")
def read_root():
    return {"message": "plan-separe-api is running!"}

