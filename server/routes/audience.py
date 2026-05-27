"""Audience & demand API."""
from fastapi import APIRouter
from server.data.mock_data import _attendance_predictions, _fan_segments

router = APIRouter(prefix="/audience", tags=["audience"])


@router.get("/predictions")
async def predictions():
    return _attendance_predictions()


@router.get("/fan-segments")
async def fan_segments():
    return _fan_segments()


@router.get("/demand-heatmap")
async def demand_heatmap():
    return [{"zone": "North Bank", "demand": 0.98}, {"zone": "Clock End", "demand": 0.96},
            {"zone": "East Stand", "demand": 0.94}, {"zone": "West Stand", "demand": 0.97}]
