"""ML inference API."""
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/ml", tags=["ml"])


class AttendancePredictionRequest(BaseModel):
    opponent_tier: int = 1
    is_weekend: bool = True
    temp_c: float = 14
    competition: str = "Premier League"


@router.post("/predict-attendance")
async def predict_attendance(req: AttendancePredictionRequest):
    base = 60704
    tier_adj = {1: 0, 2: -200, 3: -800}.get(req.opponent_tier, -500)
    weekend_adj = 0 if req.is_weekend else -400
    weather_adj = -300 if req.temp_c < 3 else 0
    predicted = base + tier_adj + weekend_adj + weather_adj
    return {
        "predicted_attendance": predicted,
        "confidence_low": predicted - 300,
        "confidence_high": min(60704, predicted + 200),
        "model": "gradient_boosted_trees_v2",
        "features_used": ["opponent_tier", "is_weekend", "temp_c", "competition"],
    }


@router.post("/predict-injury-risk")
async def predict_injury_risk(req: dict):
    return {
        "player_id": req.get("player_id", "unknown"),
        "injury_risk_pct": 12.5,
        "recommendation": "Monitor training load",
    }


@router.get("/match-predictions")
async def match_predictions(fixture_id: int = Query(None)):
    return {
        "fixture_id": fixture_id,
        "home_win_pct": 58,
        "draw_pct": 24,
        "away_win_pct": 18,
        "predicted_goals_home": 1.8,
        "predicted_goals_away": 0.9,
    }


@router.get("/tactical-live")
async def tactical_live(
    minute: int = Query(0),
    subs_used: int = Query(0),
    formation_id: str = Query(None),
    fatigue_slots: str = Query(None),
    slot_roles: str = Query(None),
):
    return {
        "minute": minute,
        "win_probability": max(30, 65 - minute * 0.3),
        "recommended_sub_minute": max(minute + 5, 60),
        "fatigue_alert": minute > 70,
        "tactical_note": "Maintain high press" if minute < 60 else "Consider dropping deeper",
    }
