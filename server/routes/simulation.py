"""Simulation API."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/simulation", tags=["simulation"])


class InjurySimRequest(BaseModel):
    player_ids: list[str]
    duration_weeks: int


class PricingSimRequest(BaseModel):
    fixture_id: str
    price_change_pct: float


@router.post("/injury")
async def simulate_injury(req: InjurySimRequest):
    return {
        "scenario": f"{len(req.player_ids)} player(s) out for {req.duration_weeks} weeks",
        "squad_readiness_impact": -5 * len(req.player_ids),
        "recommendation": "Activate youth players and adjust rotation policy",
    }


@router.post("/pricing")
async def simulate_pricing(req: PricingSimRequest):
    attendance_change = -2.5 * req.price_change_pct
    revenue_change = req.price_change_pct - abs(attendance_change) * 0.3
    return {
        "fixture_id": req.fixture_id,
        "price_change_pct": req.price_change_pct,
        "predicted_attendance_change_pct": round(attendance_change, 1),
        "predicted_revenue_change_pct": round(revenue_change, 1),
        "recommendation": "Optimal" if -1 < attendance_change < 0 else "Monitor closely",
    }
