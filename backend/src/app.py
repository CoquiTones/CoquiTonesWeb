from contextlib import asynccontextmanager
from fastapi import FastAPI, staticfiles, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from routers.security import router as security_router
from timestamp.router import router as timestamp_router
from audio.router import router as audio_router
from weather.router import router as weather_router
from node.router import router as node_router
from dashboard.router import router as dashboard_router
import mqtt
import os
import dotenv

from Logger import Logger

dotenv.load_dotenv(dotenv_path="backend/src/.env")


# Define our lifespan so we can start the mqtt client together with the server
@asynccontextmanager
async def lifespan(app: FastAPI):
    handles = await mqtt.start()
    yield
    mqtt.end(handles)


LOGGER = Logger.getInstance("Main App Component")
app = FastAPI(lifespan=lifespan)
origins = [
    "https://localhost:5173",
    "https://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the absolute path to the frontend dist directory
frontend_dist = os.path.abspath("./frontend/dist")

# Mount the dist directory to serve static assets (CSS, JS, images)
app.mount(
    "/assets",
    staticfiles.StaticFiles(directory=os.path.join(frontend_dist, "assets")),
    name="assets",
)

api = APIRouter(prefix="/api")

api.include_router(security_router)
api.include_router(timestamp_router)
api.include_router(audio_router)
api.include_router(weather_router)
api.include_router(node_router)
api.include_router(dashboard_router)

app.include_router(api)

@app.get("/{full_path:path}", response_class=HTMLResponse)
def serve_frontend():
    index_path = os.path.join(frontend_dist, "index.html")
    try:
        with open(index_path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error: {str(e)}"
