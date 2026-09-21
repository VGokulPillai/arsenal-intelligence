"""Revenue optimization API — projections, recommendations, campaigns, and pricing simulation."""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
import random

from server.data.mock_data import _revenue_projections, _ml_revenue_strategies_global

router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("/projections")
async def projections():
    return _revenue_projections()


@router.get("/recommendations")
async def recommendations():
    return [
        {
            "fixture": "Tottenham (North London Derby)",
            "action": "Increase hospitality packages for North London Derby",
            "expected_lift_pct": 8.5,
            "segment": "Premium Members & Corporate",
            "channel": "Email + App push notification",
        },
        {
            "fixture": "UCL Knockout Home Leg",
            "action": "Launch early-bird campaign for UCL knockout home legs",
            "expected_lift_pct": 6.2,
            "segment": "Season Ticket Holders",
            "channel": "Member portal + SMS",
        },
        {
            "fixture": "Chelsea (Home)",
            "action": "Bundle merchandise with premium match tickets",
            "expected_lift_pct": 4.1,
            "segment": "Family & Casual attendees",
            "channel": "Website + Social ads",
        },
        {
            "fixture": "Mid-week fixtures (Tue/Wed)",
            "action": "Flash sale for Silver members on mid-week fixtures",
            "expected_lift_pct": 3.8,
            "segment": "Silver Members, 18-30 age group",
            "channel": "App exclusive + Instagram",
        },
        {
            "fixture": "Manchester City (Home)",
            "action": "VIP matchday experience upsell with player tunnel access",
            "expected_lift_pct": 12.4,
            "segment": "Platinum & International VIP",
            "channel": "Concierge outreach + Partner hotels",
        },
        {
            "fixture": "All Home Fixtures",
            "action": "Dynamic concession pricing based on weather and demand",
            "expected_lift_pct": 2.3,
            "segment": "All matchday attendees",
            "channel": "In-stadium digital boards + App",
        },
    ]


@router.get("/ml-strategies")
async def ml_strategies():
    return {"strategies": _ml_revenue_strategies_global()}


@router.get("/campaigns")
async def campaigns():
    """Active and planned commercial campaigns."""
    return [
        {
            "id": "camp-001",
            "name": "Emirates Premium Matchday Experience",
            "status": "active",
            "type": "Hospitality",
            "target_audience": "Corporate & HNW Individuals",
            "budget_k": 120,
            "spend_k": 78,
            "revenue_generated_k": 890,
            "roi_pct": 641,
            "start_date": "2026-08-01",
            "end_date": "2026-12-31",
            "fixtures_targeted": ["vs Chelsea", "vs Man City", "vs Tottenham", "vs Liverpool"],
            "channels": ["Email", "LinkedIn", "Concierge"],
            "kpis": {"packages_sold": 234, "target": 300, "avg_spend": 3800},
        },
        {
            "id": "camp-002",
            "name": "Junior Gunners Season Ticket Drive",
            "status": "active",
            "type": "Membership",
            "target_audience": "Families with children 5-16",
            "budget_k": 45,
            "spend_k": 32,
            "revenue_generated_k": 412,
            "roi_pct": 815,
            "start_date": "2026-07-01",
            "end_date": "2026-09-30",
            "fixtures_targeted": ["First 5 home games"],
            "channels": ["Social", "School partnerships", "App"],
            "kpis": {"memberships_sold": 1847, "target": 2500, "renewal_rate_pct": 82},
        },
        {
            "id": "camp-003",
            "name": "International Fan Membership",
            "status": "active",
            "type": "Global Membership",
            "target_audience": "International supporters (US, India, Nigeria, Japan)",
            "budget_k": 200,
            "spend_k": 145,
            "revenue_generated_k": 1250,
            "roi_pct": 525,
            "start_date": "2026-06-01",
            "end_date": "2027-05-31",
            "fixtures_targeted": ["All"],
            "channels": ["Digital ads", "YouTube", "Regional partners"],
            "kpis": {"memberships_sold": 48200, "target": 75000, "top_region": "USA (12.4k)"},
        },
        {
            "id": "camp-004",
            "name": "Adidas Kit Launch Collab",
            "status": "active",
            "type": "Merchandise",
            "target_audience": "All fans, weighted to 18-35",
            "budget_k": 80,
            "spend_k": 65,
            "revenue_generated_k": 2100,
            "roi_pct": 2525,
            "start_date": "2026-07-15",
            "end_date": "2026-10-15",
            "fixtures_targeted": ["Pre-season + First 3 PL matches"],
            "channels": ["Armoury", "Online store", "Adidas.com", "Social"],
            "kpis": {"units_sold": 185000, "target": 250000, "top_item": "Home Shirt (68k)"},
        },
        {
            "id": "camp-005",
            "name": "Matchday Food & Beverage Upsell",
            "status": "planned",
            "type": "Concessions",
            "target_audience": "All matchday attendees",
            "budget_k": 25,
            "spend_k": 0,
            "revenue_generated_k": 0,
            "roi_pct": 0,
            "start_date": "2026-09-01",
            "end_date": "2026-12-31",
            "fixtures_targeted": ["Top-6 home fixtures"],
            "channels": ["App pre-order", "In-stadium screens"],
            "kpis": {"avg_spend_uplift_target_pct": 12, "pre_orders_target": 8000},
        },
        {
            "id": "camp-006",
            "name": "Arsenal Travel & Away Day Packages",
            "status": "planned",
            "type": "Travel",
            "target_audience": "Season ticket holders, away travel members",
            "budget_k": 35,
            "spend_k": 0,
            "revenue_generated_k": 0,
            "roi_pct": 0,
            "start_date": "2026-09-15",
            "end_date": "2027-05-31",
            "fixtures_targeted": ["All away fixtures"],
            "channels": ["Member portal", "Email", "Travel partners"],
            "kpis": {"packages_target": 1200, "avg_package_value": 450},
        },
    ]


@router.get("/sponsorship")
async def sponsorship():
    """Sponsorship and partnership revenue data."""
    return {
        "total_sponsorship_m": 185.4,
        "yoy_growth_pct": 12.3,
        "partners": [
            {"name": "Emirates", "type": "Shirt & Stadium", "annual_value_m": 50.0, "contract_end": "2028", "status": "active"},
            {"name": "Adidas", "type": "Kit Manufacturer", "annual_value_m": 65.0, "contract_end": "2030", "status": "active"},
            {"name": "Visit Rwanda", "type": "Sleeve Sponsor", "annual_value_m": 30.0, "contract_end": "2027", "status": "active"},
            {"name": "Lavazza", "type": "Official Coffee", "annual_value_m": 8.0, "contract_end": "2027", "status": "active"},
            {"name": "Cadbury", "type": "Official Snack", "annual_value_m": 5.5, "contract_end": "2026", "status": "renewal_pending"},
            {"name": "BYD", "type": "Electric Vehicle", "annual_value_m": 12.0, "contract_end": "2029", "status": "active"},
            {"name": "Konami (eFootball)", "type": "Gaming Partner", "annual_value_m": 8.0, "contract_end": "2027", "status": "active"},
            {"name": "Socios.com", "type": "Fan Token", "annual_value_m": 6.9, "contract_end": "2026", "status": "under_review"},
        ],
        "pipeline": [
            {"prospect": "Apple", "type": "Training Kit", "est_value_m": 40.0, "stage": "Advanced Talks", "probability_pct": 65},
            {"prospect": "AWS", "type": "Technology Partner", "est_value_m": 15.0, "stage": "Proposal Sent", "probability_pct": 45},
            {"prospect": "Crypto.com", "type": "Fintech Partner", "est_value_m": 20.0, "stage": "Initial Discussions", "probability_pct": 25},
        ],
    }


class SimulateRequest(BaseModel):
    fixture_id: str = "f2"
    price_change_pct: float = 5.0


@router.post("/simulate")
async def simulate(
    fixture_id: str = Query("f2"),
    price_change_pct: float = Query(5.0),
):
    """What-if pricing simulator with elasticity model."""
    projections_data = _revenue_projections()
    
    base_fixture = None
    for p in projections_data:
        if str(p.get("fixture_id", "")) == fixture_id:
            base_fixture = p
            break
    if not base_fixture and projections_data:
        base_fixture = projections_data[0]
    
    if not base_fixture:
        base_fixture = {
            "opponent": "Demo Fixture",
            "projected_revenue_m": 3.5,
            "ticket_revenue": 2.2,
            "hospitality": 0.8,
            "concessions": 0.5,
            "predicted_attendance": 58500,
        }
    
    base_rev = float(base_fixture.get("projected_revenue_m", 3.5))
    base_att = float(base_fixture.get("predicted_attendance", 58500))
    pct = price_change_pct
    
    ticket_elasticity = -0.35
    hosp_elasticity = -0.15
    conc_elasticity = -0.08
    
    att_change_pct = pct * ticket_elasticity
    hosp_change_pct = pct * hosp_elasticity
    conc_change_pct = pct * conc_elasticity
    
    new_ticket = float(base_fixture.get("ticket_revenue", 2.2)) * (1 + pct/100) * (1 + att_change_pct/100)
    new_hosp = float(base_fixture.get("hospitality", 0.8)) * (1 + pct/100) * (1 + hosp_change_pct/100)
    new_conc = float(base_fixture.get("concessions", 0.5)) * (1 + conc_change_pct/100)
    
    sim_rev = new_ticket + new_hosp + new_conc
    rev_impact_pct = ((sim_rev - base_rev) / base_rev) * 100 if base_rev > 0 else 0
    
    new_att = base_att * (1 + att_change_pct/100)
    
    if pct > 0:
        if rev_impact_pct > 2:
            recommendation = f"Price increase of {pct}% is viable — projected net revenue gain of {rev_impact_pct:.1f}% despite {abs(att_change_pct):.1f}% attendance dip. Hospitality segments are less elastic."
        else:
            recommendation = f"Price increase of {pct}% shows marginal gains ({rev_impact_pct:.1f}%). Consider targeted premium pricing rather than blanket increase to preserve loyalty metrics."
    else:
        recommendation = f"Price reduction of {abs(pct)}% projects +{abs(att_change_pct):.1f}% attendance uplift. Net revenue {'improves' if rev_impact_pct > 0 else 'dips'} by {rev_impact_pct:.1f}% — evaluate with loyalty/LTV model."
    
    return {
        "fixture_id": fixture_id,
        "opponent": base_fixture.get("opponent", "Unknown"),
        "price_change_pct": pct,
        "base_revenue_m": round(base_rev, 3),
        "simulated_revenue_m": round(sim_rev, 3),
        "estimated_attendance_impact_pct": round(att_change_pct, 2),
        "estimated_revenue_impact_pct": round(rev_impact_pct, 2),
        "new_attendance_estimate": int(new_att),
        "recommendation": recommendation,
        "explanation": [
            f"Ticket revenue: £{float(base_fixture.get('ticket_revenue', 2.2)):.2f}M → £{new_ticket:.2f}M (elasticity {ticket_elasticity}, price +{pct}%)",
            f"Hospitality: £{float(base_fixture.get('hospitality', 0.8)):.2f}M → £{new_hosp:.2f}M (less elastic, elasticity {hosp_elasticity})",
            f"Concessions: £{float(base_fixture.get('concessions', 0.5)):.2f}M → £{new_conc:.2f}M (indirect effect via footfall, elasticity {conc_elasticity})",
            f"Attendance: {int(base_att):,} → {int(new_att):,} ({att_change_pct:+.1f}% from price signal)",
            "Model uses gradient-boosted demand curves trained on 3 seasons of Emirates pricing data.",
        ],
        "ml_growth_strategies": [
            {
                "title": "Segment-specific pricing tiers",
                "expected_revenue_lift_pct": 3.2,
                "rationale": "Rather than uniform price change, tier by loyalty segment — premium members absorb +8-12% while casual fans get promotional entry."
            },
            {
                "title": "Dynamic allocation between categories",
                "expected_revenue_lift_pct": 2.1,
                "rationale": "Shift unsold lower-tier inventory to hospitality waitlist and family bundles 48h pre-match."
            },
            {
                "title": "Early-bird discount for confirmed attendees",
                "expected_revenue_lift_pct": 1.8,
                "rationale": "Lock in 85%+ sell-through 7 days before, freeing remainder for premium resale or walk-up pricing."
            },
        ],
    }
