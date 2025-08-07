from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from frank.ws import router as ws_router
from frank.core.logging import configure_logging
from frank.api.routes import router as api_router
from frank.core.config import settings
import os


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://*.modal.run",
        "https://frank.xfr.llc",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

configure_logging(app)

# Export the Google key if provided so pydantic-ai picks it up
if settings.GOOGLE_API_KEY:
    os.environ.setdefault("GOOGLE_API_KEY", settings.GOOGLE_API_KEY)

app.include_router(ws_router)
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
