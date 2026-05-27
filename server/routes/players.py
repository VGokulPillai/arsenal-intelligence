"""Player data API."""
from fastapi import APIRouter
from server.data.mock_data import PLAYERS, _player_performance, _health_status

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/")
async def list_players():
    return PLAYERS


@router.get("/performance/summary")
async def performance_summary():
    return _player_performance()


@router.get("/health/status")
async def health_status():
    return _health_status()


@router.get("/{player_id}")
async def get_player(player_id: str):
    for p in PLAYERS:
        if p["id"] == player_id:
            return p
    return {"error": "Player not found"}
