"""Mock data for Arsenal FC Football Intelligence Platform - executive-grade demo dataset."""
from datetime import date, datetime, timedelta
import random

random.seed(42)

PLAYERS = [
    {"id": "p1", "name": "Bukayo Saka", "position": "Winger", "number": 7, "age": 24, "nationality": "England"},
    {"id": "p2", "name": "Martin Ødegaard", "position": "Midfielder", "number": 8, "age": 27, "nationality": "Norway"},
    {"id": "p3", "name": "Declan Rice", "position": "Midfielder", "number": 41, "age": 27, "nationality": "England"},
    {"id": "p4", "name": "William Saliba", "position": "Defender", "number": 2, "age": 25, "nationality": "France"},
    {"id": "p5", "name": "Gabriel Jesus", "position": "Striker", "number": 9, "age": 29, "nationality": "Brazil"},
    {"id": "p6", "name": "Kai Havertz", "position": "Striker", "number": 29, "age": 27, "nationality": "Germany"},
    {"id": "p7", "name": "Gabriel Magalhães", "position": "Defender", "number": 6, "age": 27, "nationality": "Brazil"},
    {"id": "p8", "name": "Ben White", "position": "Defender", "number": 4, "age": 28, "nationality": "England"},
    {"id": "p9", "name": "David Raya", "position": "Goalkeeper", "number": 22, "age": 29, "nationality": "Spain"},
    {"id": "p10", "name": "Leandro Trossard", "position": "Winger", "number": 19, "age": 29, "nationality": "Belgium"},
    {"id": "p11", "name": "Jurriën Timber", "position": "Defender", "number": 12, "age": 24, "nationality": "Netherlands"},
    {"id": "p12", "name": "Gabriel Martinelli", "position": "Winger", "number": 11, "age": 25, "nationality": "Brazil"},
]

def _fixtures() -> list:
    return [
        {"id": "f1", "opponent": "Manchester City", "competition": "Premier League", "venue": "Emirates Stadium",
         "date": "2026-05-25", "kickoff": "16:30", "is_home": True, "venue_image_url": None},
        {"id": "f2", "opponent": "Liverpool", "competition": "Premier League", "venue": "Anfield",
         "date": "2026-05-18", "kickoff": "14:00", "is_home": False, "venue_image_url": None},
        {"id": "f3", "opponent": "Chelsea", "competition": "Premier League", "venue": "Emirates Stadium",
         "date": "2026-05-10", "kickoff": "17:30", "is_home": True, "venue_image_url": None},
        {"id": "f4", "opponent": "Tottenham Hotspur", "competition": "Premier League", "venue": "Tottenham Hotspur Stadium",
         "date": "2026-05-04", "kickoff": "14:00", "is_home": False, "venue_image_url": None},
        {"id": "f5", "opponent": "Aston Villa", "competition": "Premier League", "venue": "Emirates Stadium",
         "date": "2026-04-27", "kickoff": "15:00", "is_home": True, "venue_image_url": None},
        {"id": "f6", "opponent": "Newcastle United", "competition": "Premier League", "venue": "St James' Park",
         "date": "2026-04-20", "kickoff": "12:30", "is_home": False, "venue_image_url": None},
        {"id": "f7", "opponent": "West Ham United", "competition": "Premier League", "venue": "Emirates Stadium",
         "date": "2026-04-13", "kickoff": "15:00", "is_home": True, "venue_image_url": None},
    ]

def _player_performance():
    perf = []
    for p in PLAYERS:
        base_xg = 0.35 if p["position"] == "Striker" else 0.18 if "Midfielder" in p["position"] else 0.08
        perf.append({
            "player_id": p["id"],
            "player_name": p["name"],
            "position": p["position"],
            "matches_played": 5,
            "goals": random.randint(0, 4) if "Striker" in p["position"] or "Winger" in p["position"] else random.randint(0, 3),
            "assists": random.randint(0, 4),
            "xG": round(base_xg * (4 + random.random() * 2), 2),
            "xA": round(0.12 * (2 + random.random() * 3), 2),
            "pass_completion": round(86 + random.random() * 11, 1),
            "distance_km": round(9.5 + random.random() * 3, 1),
            "sprints": random.randint(22, 48),
            "form_trend": random.choice(["up", "stable", "down"]),
        })
    return perf

def _health_status():
    return [
        {"player_id": p["id"], "player_name": p["name"], "status": "Available", "injury_risk": "Low",
         "fatigue": round(20 + random.random() * 50, 0), "training_load": round(70 + random.random() * 25, 0)}
        for p in PLAYERS[:9]
    ] + [
        {"player_id": "p10", "player_name": "Leandro Trossard", "status": "Minor Knock", "injury_risk": "Medium",
         "fatigue": 55, "training_load": 72},
        {"player_id": "p11", "player_name": "Jurriën Timber", "status": "Available", "injury_risk": "Low",
         "fatigue": 38, "training_load": 85},
    ]

def _attendance_predictions():
    base = datetime.now()
    return [
        {"fixture_id": "f1", "opponent": "Manchester City", "date": (base + timedelta(days=2)).strftime("%Y-%m-%d"),
         "predicted_attendance": 60704, "predicted_occupancy": 1.0, "confidence_low": 60200, "confidence_high": 60704,
         "demand_tier": "Very High", "booking_velocity": 1.9},
        {"fixture_id": "f3", "opponent": "Chelsea", "date": (base + timedelta(days=9)).strftime("%Y-%m-%d"),
         "predicted_attendance": 60704, "predicted_occupancy": 1.0, "confidence_low": 60100, "confidence_high": 60704,
         "demand_tier": "Very High", "booking_velocity": 1.7},
        {"fixture_id": "f5", "opponent": "Aston Villa", "date": (base + timedelta(days=23)).strftime("%Y-%m-%d"),
         "predicted_attendance": 59800, "predicted_occupancy": 0.985, "confidence_low": 58500, "confidence_high": 60704,
         "demand_tier": "High", "booking_velocity": 1.3},
        {"fixture_id": "f7", "opponent": "West Ham United", "date": (base + timedelta(days=30)).strftime("%Y-%m-%d"),
         "predicted_attendance": 58200, "predicted_occupancy": 0.959, "confidence_low": 56800, "confidence_high": 60100,
         "demand_tier": "High", "booking_velocity": 1.1},
    ]

def _transfer_targets():
    return [
        {"id": "t1", "name": "Alexander Isak", "position": "Striker", "age": 27, "club": "Newcastle United",
         "sporting_fit": 92, "commercial_value": 88, "popularity": 86, "tactical_fit": 90, "risk_level": "Low",
         "estimated_value_m": 85, "recommendation": "Elite finisher - perfect Arteta profile striker"},
        {"id": "t2", "name": "Florian Wirtz", "position": "Midfielder", "age": 23, "club": "Bayer Leverkusen",
         "sporting_fit": 94, "commercial_value": 95, "popularity": 92, "tactical_fit": 91, "risk_level": "Medium",
         "estimated_value_m": 110, "recommendation": "Generational talent - creative depth behind Ødegaard"},
        {"id": "t3", "name": "Josko Gvardiol", "position": "Defender", "age": 24, "club": "Manchester City",
         "sporting_fit": 88, "commercial_value": 78, "popularity": 75, "tactical_fit": 90, "risk_level": "Low",
         "estimated_value_m": 70, "recommendation": "Ball-playing LCB depth for Saliba/Gabriel rotation"},
        {"id": "t4", "name": "Moisés Caicedo", "position": "Midfielder", "age": 24, "club": "Chelsea",
         "sporting_fit": 90, "commercial_value": 82, "popularity": 80, "tactical_fit": 92, "risk_level": "Low",
         "estimated_value_m": 95, "recommendation": "Elite #6 profile to complement Rice in double pivot"},
    ]

def _media_sentiment():
    return [
        {"player_id": p["id"], "player_name": p["name"], "sentiment_score": round(65 + random.random() * 30, 1),
         "popularity_momentum": random.choice(["rising", "stable", "declining"]),
         "media_mentions_7d": random.randint(80, 600), "brand_value_estimate": round(30 + random.random() * 70, 1)}
        for p in PLAYERS[:6]
    ]

def _revenue_projections():
    return [
        {"fixture_id": "f1", "opponent": "Manchester City", "projected_revenue": 4.8, "ticket_revenue": 3.1,
         "hospitality": 1.2, "concessions": 0.5, "optimal_price_band": "Premium"},
        {"fixture_id": "f3", "opponent": "Chelsea", "projected_revenue": 4.5, "ticket_revenue": 2.9,
         "hospitality": 1.1, "concessions": 0.5, "optimal_price_band": "Premium"},
        {"fixture_id": "f5", "opponent": "Aston Villa", "projected_revenue": 3.8, "ticket_revenue": 2.4,
         "hospitality": 0.9, "concessions": 0.5, "optimal_price_band": "Standard"},
    ]

def _alerts():
    return [
        {"id": "a1", "type": "news", "severity": "info", "title": "Press conference: Manchester City (H)",
         "message": "Mikel Arteta addresses media ahead of the defining title clash at Emirates Stadium", "timestamp": datetime.now().isoformat()},
        {"id": "a2", "type": "injury", "severity": "warning", "title": "Saka back in full training",
         "message": "Star winger cleared for weekend selection after precautionary rest", "timestamp": datetime.now().isoformat()},
        {"id": "a3", "type": "media", "severity": "info", "title": "Arsenal 2 points clear at the top",
         "message": "Global media spotlight on Emirates — title race entering its decisive phase", "timestamp": datetime.now().isoformat()},
        {"id": "a4", "type": "news", "severity": "info", "title": "Ødegaard named PL Player of the Month",
         "message": "Captain's outstanding form recognised — 4 goals and 6 assists in April", "timestamp": datetime.now().isoformat()},
    ]

def _fan_segments():
    return [
        {"segment": "Season Ticket Holders", "count": 45000, "avg_spend": 1200, "attendance_rate": 0.97},
        {"segment": "Silver Members", "count": 18000, "avg_spend": 280, "attendance_rate": 0.65},
        {"segment": "Hospitality Premium", "count": 6500, "avg_spend": 3800, "attendance_rate": 0.92},
        {"segment": "International Fans", "count": 25000, "avg_spend": 520, "attendance_rate": 0.12},
    ]

def _past_match_results_dynamic() -> list:
    today = date.today()
    specs = [
        ("Wolverhampton", True, "3-0", 60704, 3.8),
        ("Bournemouth", False, "2-1", 0, 0.42),
        ("Manchester United", True, "2-0", 60704, 4.5),
        ("Brighton", True, "4-1", 60302, 3.9),
        ("Crystal Palace", False, "1-0", 0, 0.38),
        ("Tottenham Hotspur", True, "3-2", 60704, 5.2),
        ("Everton", False, "2-0", 0, 0.35),
    ]
    out = []
    for i, (opp, home, score, att, rev) in enumerate(specs):
        d = today - timedelta(days=7 * (i + 1))
        venue = "Emirates Stadium" if home else f"{opp} (away)"
        out.append({
            "opponent": opp,
            "date": d.isoformat(),
            "is_home": home,
            "venue": venue,
            "score": score,
            "attendance": att,
            "matchday_revenue_m": rev,
            "competition": "Premier League",
        })
    return out


def _fixture_date_key(f: dict) -> date:
    try:
        return datetime.strptime(f["date"], "%Y-%m-%d").date()
    except (ValueError, KeyError, TypeError):
        return date.today()


def _demand_for_fixture(f: dict) -> dict:
    seed = sum(ord(c) for c in f.get("opponent", "")) % 5000
    is_home = f.get("is_home", True)
    if is_home:
        pred = 58500 + (seed % 2204)
        cap = 60704
        occ = min(0.999, pred / cap)
    else:
        pred = 0
        occ = 0.0
    tier = "Very High" if pred > 60000 else "High" if pred > 58000 else "Medium" if pred > 0 else "Away"
    margin = 400 + seed % 800
    return {
        "predicted_attendance": pred,
        "predicted_occupancy": round(occ, 3),
        "demand_tier": tier,
        "confidence_low": max(0, pred - margin),
        "confidence_high": min(cap, pred + margin) if is_home else 0,
    }


def _revenue_for_fixture(f: dict) -> dict:
    seed = sum(ord(c) for c in f.get("opponent", "")) % 7000
    if not f.get("is_home"):
        tr = round(0.08 + (seed % 60) / 1000, 2)
        return {
            "projected_revenue_m": round(tr + 0.15 + (seed % 40) / 1000, 2),
            "ticket_revenue": tr,
            "hospitality": 0.10,
            "concessions": 0.06,
            "optimal_price_band": "Away allocation",
        }
    base = 3.2 + (seed % 2200) / 1000
    base = round(base, 2)
    return {
        "projected_revenue_m": base,
        "ticket_revenue": round(base * 0.64, 2),
        "hospitality": round(base * 0.22, 2),
        "concessions": round(base * 0.14, 2),
        "optimal_price_band": "Premium" if base > 4.2 else "Standard",
    }


def _opponent_draw_tier(opponent: str) -> str:
    o = opponent.lower()
    big = ("manchester city", "liverpool", "chelsea", "tottenham", "manchester united")
    if any(x in o for x in big):
        return "tier_1_top_six"
    if any(x in o for x in ("aston villa", "newcastle", "brighton", "west ham")):
        return "tier_2_challengers"
    return "tier_3_standard"


def _revenue_rationale_lines(f: dict, rev: dict, dmd: dict) -> list:
    opp = f.get("opponent", "Opponent")
    tier = _opponent_draw_tier(opp)
    band = rev.get("optimal_price_band", "")
    att = dmd.get("predicted_attendance", 0)
    dt = dmd.get("demand_tier", "")
    lines = [
        f"Gate model: ~{att:,} forecast attendance -> {dt} demand tier.",
        f"Mix: £{rev.get('ticket_revenue')}M (64%), hospitality £{rev.get('hospitality')}M, retail/F&B £{rev.get('concessions')}M.",
        f"Pricing band '{band}' from elasticity + opponent draw ({tier.replace('_', ' ')}).",
    ]
    if tier == "tier_1_top_six":
        lines.append("Top six fixture: premium hospitality attach and high secondary demand (ML prior).")
    elif tier == "tier_2_challengers":
        lines.append("Challenger fixture - strong demand but some price elasticity in upper tiers.")
    else:
        lines.append("Growth lever: targeted promos to Silver members (see ML strategies).")
    lines.append("Anchored to recent Emirates Stadium home actuals in platform history.")
    return lines


def _ml_revenue_strategies_global() -> list:
    return [
        {
            "title": "Dynamic block pricing",
            "expected_revenue_lift_pct": 5.1,
            "rationale": "Gradient-boosted demand model flags under-priced sectors vs sell-through; +3-7% yield without hurting loyalty.",
            "owner": "Commercial / Ticketing",
        },
        {
            "title": "Hospitality package upsell",
            "expected_revenue_lift_pct": 6.8,
            "rationale": "Propensity model on member + app data; pre-match bundles lift attach 9-14% on tier-1 fixtures.",
            "owner": "Hospitality",
        },
        {
            "title": "Weather-aware flash promos",
            "expected_revenue_lift_pct": 1.8,
            "rationale": "Attendance ML features include rain/temp; auto-trigger family-zone promos when demand risk > median.",
            "owner": "Marketing",
        },
        {
            "title": "Concessions throughput",
            "expected_revenue_lift_pct": 1.6,
            "rationale": "Footfall x queue model: extra kiosks in Clock End concourse at top-tier games reduces drop-off ~1.6% spend.",
            "owner": "Operations",
        },
    ]


def get_matchday_insights(schedule: list | None = None) -> dict:
    today = date.today()
    schedule = schedule if schedule is not None else _fixtures()
    upcoming = [f for f in schedule if _fixture_date_key(f) >= today]
    upcoming.sort(key=lambda f: f["date"])
    next_fx = upcoming[0] if upcoming else None

    past = _past_match_results_dynamic()
    past.sort(key=lambda p: p["date"], reverse=True)

    upcoming_with_demand = [{**f, **_demand_for_fixture(f)} for f in upcoming]
    next_with_demand = None
    if next_fx:
        next_with_demand = {**next_fx, **_demand_for_fixture(next_fx)}

    home_upcoming = [f for f in upcoming if f.get("is_home")]
    if not home_upcoming and upcoming:
        home_upcoming = upcoming[:6]
        for f in home_upcoming:
            f["is_home"] = True
            if not f.get("venue") or "away" in f.get("venue", "").lower():
                f["venue"] = "Emirates Stadium"

    upcoming_home_revenue = []
    total_projected_home_m = 0.0
    for f in home_upcoming:
        r = _revenue_for_fixture(f)
        dmd = _demand_for_fixture(f)
        total_projected_home_m += r["projected_revenue_m"]
        rationale = _revenue_rationale_lines(f, r, dmd)
        upcoming_home_revenue.append({
            "fixture_id": f.get("id"),
            "opponent": f["opponent"],
            "date": f["date"],
            "venue": f.get("venue"),
            "competition": f.get("competition"),
            "predicted_attendance": dmd["predicted_attendance"],
            "demand_tier": dmd["demand_tier"],
            "revenue_rationale": rationale,
            "revenue_rationale_summary": " ".join(rationale[:2]),
            **r,
        })

    hist_home = [p for p in past if p.get("is_home")]
    total_historical_home_revenue_m = round(sum(float(p["matchday_revenue_m"]) for p in hist_home), 2)

    last_match = past[0] if past else None

    return {
        "as_of": datetime.now().isoformat(),
        "last_match": last_match,
        "next_fixture": next_fx,
        "next_match_demand": next_with_demand,
        "previous_fixtures": past,
        "upcoming_fixtures_demand": upcoming_with_demand,
        "upcoming_home_revenue": upcoming_home_revenue,
        "total_projected_revenue_upcoming_homes_m": round(total_projected_home_m, 2),
        "total_historical_home_revenue_m": total_historical_home_revenue_m,
        "ml_revenue_strategies": _ml_revenue_strategies_global(),
    }


def get_executive_summary():
    return {
        "squad_readiness": 92,
        "available_players": 22,
        "injury_risk_count": 2,
        "next_match_attendance": 60704,
        "next_match_opponent": "Manchester City",
        "projected_ticket_revenue_m": 4.2,
        "top_transfer_opportunity": "Alexander Isak",
        "most_marketable_player": "Bukayo Saka",
        "campaign_recommendation": "Feature Saka's world-class Premier League title-winning campaign in creative",
        "overall_sentiment": "Positive",
    }
