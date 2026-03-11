from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import treino

app = FastAPI()

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas origens
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(treino.router)

@app.get("/")
def home():
    return {"message": "API funcionando correctamente"}