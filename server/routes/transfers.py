"""Transfer intelligence API."""
from fastapi import APIRouter
from server.data.mock_data import _transfer_targets

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.get("/targets")
async def targets():
    return _transfer_targets()


@router.get("/targets/{target_id}")
async def get_target(target_id: str):
    for t in _transfer_targets():
        if t["id"] == target_id:
            return t
    return {"error": "Target not found"}
