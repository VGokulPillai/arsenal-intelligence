"""Squad value API."""
from fastapi import APIRouter
from server.data.mock_data import PLAYERS

router = APIRouter(prefix="/squad-value", tags=["squad-value"])


@router.get("/squad")
async def squad():
    squad_data = []
    for p in PLAYERS:
        squad_data.append({
            "id": p["id"],
            "name": p["name"],
            "position": p["position"],
            "market_value_m": 45 + hash(p["name"]) % 80,
            "contract_expires": "2028-06-30",
            "loan_status": None,
        })
    return {"squad": squad_data, "total_value_m": sum(45 + hash(p["name"]) % 80 for p in PLAYERS)}


@router.get("/transfer-potential")
async def transfer_potential():
    return {
        "high_value_sales": [
            {"name": "Gabriel Martinelli", "estimated_fee_m": 55, "interest": "High"},
        ],
        "total_potential_revenue_m": 55,
    }
