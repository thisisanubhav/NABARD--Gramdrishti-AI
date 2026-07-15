from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth_router, enterprises, external, intelligence, officer, transactions

app = FastAPI(title="GramDrishti AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(enterprises.router)
app.include_router(transactions.router)
app.include_router(external.router)
app.include_router(intelligence.router)
app.include_router(officer.router)


@app.get("/health")
def health():
    return {"status": "ok"}
