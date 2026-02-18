from fastapi import FastAPI

app = FastAPI()

@app.get("/clientes")

def clientes():
     return {"clientes": [{"nombre": "neider", "edad": 25}, 
                          {"nombre": "jhojan", "edad": 30}, 
                          {"nombre": "cliente3", "edad": 35}]}
                            