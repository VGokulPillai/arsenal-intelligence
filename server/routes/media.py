"""Media & sentiment API."""
from fastapi import APIRouter
from server.data.mock_data import _media_sentiment

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/sentiment")
async def sentiment():
    return _media_sentiment()


@router.get("/trending")
async def trending():
    return [
        {"topic": "Title Race", "mentions": 4520, "sentiment": "positive"},
        {"topic": "Bukayo Saka", "mentions": 3890, "sentiment": "positive"},
        {"topic": "North London Derby", "mentions": 2740, "sentiment": "mixed"},
        {"topic": "Transfer Window", "mentions": 2100, "sentiment": "neutral"},
    ]


@router.get("/news-summary")
async def news_summary():
    return [
        {"title": "Arteta: 'We are ready for the title run-in'", "source": "arsenal.com", "date": "2026-05-22"},
        {"title": "Saka named Premier League Player of the Month", "source": "premierleague.com", "date": "2026-05-20"},
        {"title": "Emirates atmosphere praised as best in Europe", "source": "The Athletic", "date": "2026-05-19"},
        {"title": "Rice & Ødegaard partnership driving title charge", "source": "Sky Sports", "date": "2026-05-18"},
    ]


@router.get("/transfer-news")
async def transfer_news():
    return {"articles": [
        {"title": "Arsenal tracking Isak situation closely", "source": "David Ornstein"},
        {"title": "Wirtz future: Arsenal among interested clubs", "source": "Fabrizio Romano"},
    ], "source": "aggregated"}


@router.get("/match-reports")
async def match_reports():
    return {"articles": [
        {"title": "Arsenal 3-0 Wolves: Dominant display keeps title dream alive", "source": "BBC Sport"},
        {"title": "Saka masterclass as Gunners cruise to victory", "source": "Sky Sports"},
    ], "source": "aggregated"}


@router.get("/news-insights")
async def news_insights():
    return {
        "injuries": [{"player": "Trossard", "status": "Minor knock - available for weekend"}],
        "transfers_in": [{"player": "Isak", "status": "Strong interest - £85M valuation"}],
        "transfers_out": [],
        "summary": "Arsenal in strong position heading into title-deciding final matches",
        "source": "arsenal.com + aggregated media",
    }
