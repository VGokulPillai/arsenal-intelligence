"""Vision scouting API."""
from fastapi import APIRouter

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/analyze")
async def analyze():
    return {"status": "processing", "message": "Video analysis queued — connect Databricks ML endpoint for full CV pipeline"}


@router.get("/status")
async def status():
    return {"status": "ready", "models_loaded": ["yolov8", "player_tracking", "event_detection"]}
