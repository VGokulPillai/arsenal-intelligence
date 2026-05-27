"""Revenue optimization API."""
from fastapi import APIRouter
from server.data.mock_data import _revenue_projections, _ml_revenue_strategies_global

router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("/projections")
async def projections():
    return _revenue_projections()


@router.get("/recommendations")
async def recommendations():
    return [
        {"action": "Increase hospitality packages for North London Derby"},
        {"action": "Launch early-bird campaign for UCL knockout home legs"},
        {"action": "Bundle merchandise with premium match tickets"},
        {"action": "Flash sale for Silver members on mid-week fixtures"},
    ]


@router.get("/ml-strategies")
async def ml_strategies():
    return {"strategies": _ml_revenue_strategies_global()}
