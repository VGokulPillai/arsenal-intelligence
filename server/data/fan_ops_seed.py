"""Arsenal Fan Group Matchday Operations - Synthetic data generator.

Generates realistic Arsenal-specific fan groups, fans, ticket allocations,
check-in events, and issues for demo purposes.
"""
import random
import uuid
from datetime import datetime, timedelta

from server.data.fan_ops_db import execute_many, is_seeded, initialize_schema

random.seed(2024)


FAN_GROUPS = [
    # Local supporter groups
    {"group_id": "fg-001", "name": "North Bank Loyal", "region": "London", "group_type": "local", "primary_contact": "James Harper", "contact_email": "james@northbankloyal.co.uk", "member_count": 48},
    {"group_id": "fg-002", "name": "Clock End Faithful", "region": "London", "group_type": "local", "primary_contact": "Sarah Mitchell", "contact_email": "sarah@clockendfaithful.org", "member_count": 62},
    {"group_id": "fg-003", "name": "Islington Gooners", "region": "London", "group_type": "local", "primary_contact": "David Chen", "contact_email": "david@islingtongooners.com", "member_count": 35},
    {"group_id": "fg-004", "name": "Holloway Road Reds", "region": "London", "group_type": "local", "primary_contact": "Mark Williams", "contact_email": "mark@hollowayreds.co.uk", "member_count": 28},
    {"group_id": "fg-005", "name": "Highbury Heroes", "region": "London", "group_type": "local", "primary_contact": "Emma Thompson", "contact_email": "emma@highburyheroes.org", "member_count": 41},
    # International supporter groups
    {"group_id": "fg-006", "name": "Arsenal Mumbai", "region": "India", "group_type": "international", "primary_contact": "Rahul Patel", "contact_email": "rahul@arsenalmumbai.in", "member_count": 120},
    {"group_id": "fg-007", "name": "Arsenal NYC", "region": "USA", "group_type": "international", "primary_contact": "Mike Johnson", "contact_email": "mike@arsenalnyc.com", "member_count": 85},
    {"group_id": "fg-008", "name": "Gunners Tokyo", "region": "Japan", "group_type": "international", "primary_contact": "Yuki Tanaka", "contact_email": "yuki@gunnerstokyo.jp", "member_count": 52},
    {"group_id": "fg-009", "name": "Arsenal Lagos Supporters", "region": "Nigeria", "group_type": "international", "primary_contact": "Chidi Okafor", "contact_email": "chidi@arsenallagos.ng", "member_count": 95},
    {"group_id": "fg-010", "name": "Gunners Down Under", "region": "Australia", "group_type": "international", "primary_contact": "Steve Clarke", "contact_email": "steve@gunnersdownunder.au", "member_count": 67},
    {"group_id": "fg-011", "name": "Arsenal Berlin", "region": "Germany", "group_type": "international", "primary_contact": "Hans Mueller", "contact_email": "hans@arsenalberlin.de", "member_count": 44},
    {"group_id": "fg-012", "name": "Gooners Scandinavia", "region": "Norway", "group_type": "international", "primary_contact": "Erik Larsen", "contact_email": "erik@goonersscandinavia.no", "member_count": 38},
    # Trusts and official groups
    {"group_id": "fg-013", "name": "Arsenal Supporters' Trust", "region": "London", "group_type": "trust", "primary_contact": "Tim Payton", "contact_email": "tim@arsenaltrust.org", "member_count": 200},
    {"group_id": "fg-014", "name": "Junior Gunners Collective", "region": "London", "group_type": "trust", "primary_contact": "Lisa Brown", "contact_email": "lisa@juniorgunners.co.uk", "member_count": 150},
    {"group_id": "fg-015", "name": "Arsenal Women Supporters", "region": "London", "group_type": "trust", "primary_contact": "Kate Robinson", "contact_email": "kate@awsupporters.org", "member_count": 78},
    # Accessibility groups
    {"group_id": "fg-016", "name": "Arsenal Disabled Supporters' Association", "region": "London", "group_type": "accessibility", "primary_contact": "Robert Nash", "contact_email": "robert@arsenaldsa.org", "member_count": 65},
    {"group_id": "fg-017", "name": "Visually Impaired Gunners", "region": "London", "group_type": "accessibility", "primary_contact": "Angela Foster", "contact_email": "angela@vigunners.org", "member_count": 22},
    # Corporate / hospitality
    {"group_id": "fg-018", "name": "Emirates Premium Partners", "region": "London", "group_type": "corporate", "primary_contact": "Richard Hayes", "contact_email": "richard@premiumpartners.co.uk", "member_count": 30},
    {"group_id": "fg-019", "name": "Arsenal Corporate Alliance", "region": "London", "group_type": "corporate", "primary_contact": "Diana Scott", "contact_email": "diana@corpalliance.com", "member_count": 45},
    {"group_id": "fg-020", "name": "Cannon Club VIP", "region": "London", "group_type": "corporate", "primary_contact": "Peter Maxwell", "contact_email": "peter@cannonclub.co.uk", "member_count": 25},
]

FIXTURES = [
    {"match_id": "m-001", "opponent": "Manchester City", "date": "2026-05-25", "venue": "Emirates Stadium", "competition": "Premier League", "kickoff": "16:30", "is_home": 1},
    {"match_id": "m-002", "opponent": "Chelsea", "date": "2026-05-10", "venue": "Emirates Stadium", "competition": "Premier League", "kickoff": "17:30", "is_home": 1},
    {"match_id": "m-003", "opponent": "Aston Villa", "date": "2026-04-27", "venue": "Emirates Stadium", "competition": "Premier League", "kickoff": "15:00", "is_home": 1},
    {"match_id": "m-004", "opponent": "West Ham United", "date": "2026-04-13", "venue": "Emirates Stadium", "competition": "Premier League", "kickoff": "15:00", "is_home": 1},
    {"match_id": "m-005", "opponent": "Wolverhampton", "date": "2026-03-30", "venue": "Emirates Stadium", "competition": "Premier League", "kickoff": "15:00", "is_home": 1},
]

FIRST_NAMES = [
    "James", "Oliver", "William", "George", "Harry", "Jack", "Thomas", "Charlie", "Oscar", "Leo",
    "Emma", "Sophia", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Aisha", "Fatima", "Yuki", "Raj", "Chen", "Oluwaseun", "Kwame", "Priya", "Mei", "Diego",
    "Mohammed", "Liam", "Noah", "Ethan", "Lucas", "Mason", "Logan", "Alexander", "Daniel", "Benjamin",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Wilson", "Taylor", "Davies", "Evans", "Thomas",
    "Patel", "Kumar", "Singh", "Ali", "Khan", "Chen", "Wang", "Tanaka", "Kim", "Okafor",
    "Mueller", "Larsen", "Schmidt", "Fernandez", "Garcia", "Martinez", "Anderson", "Clark", "Lewis", "Harris",
]

STANDS = ["North Bank", "Clock End", "East Stand", "West Stand"]
GATES = ["A", "B", "C", "D", "E", "F", "G", "H"]
BLOCKS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

ISSUE_TYPES = ["gate_access", "seating_dispute", "accessibility_request", "late_allocation", "payment_issue", "group_separation", "transport_delay"]
ISSUE_DESCRIPTIONS = {
    "gate_access": ["Group assigned incorrect gate", "Gate closed early, fans redirected", "Stewards unaware of group allocation"],
    "seating_dispute": ["Seats allocated across different blocks", "Block does not match group preference", "Obstructed view in allocated section"],
    "accessibility_request": ["Wheelchair space not reserved", "Companion seat needed", "Sensory room request", "Lift access required at gate"],
    "late_allocation": ["Tickets not received 48h before match", "Allocation reduced without notice", "Group split into multiple batches"],
    "payment_issue": ["Payment confirmation delayed", "Overcharge on group booking", "Refund pending for cancelled tickets"],
    "group_separation": ["Group split across stands", "Families separated in allocation", "Corporate block not adjacent"],
    "transport_delay": ["Group coach delayed - need late entry", "International flight delayed", "Train disruption affecting group"],
}


def _gen_fan_id() -> str:
    return f"fan-{uuid.uuid4().hex[:8]}"


def _gen_ticket_id() -> str:
    return f"tkt-{uuid.uuid4().hex[:8]}"


def _gen_membership_id() -> str:
    return f"AFC-{random.randint(100000, 999999)}"


def seed_data():
    """Generate and insert all synthetic data."""
    if is_seeded():
        return

    initialize_schema()

    # Insert fixtures
    execute_many(
        "INSERT INTO fan_ops_fixtures (match_id, opponent, date, venue, competition, kickoff, is_home) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(f["match_id"], f["opponent"], f["date"], f["venue"], f["competition"], f["kickoff"], f["is_home"]) for f in FIXTURES]
    )

    # Insert fan groups
    execute_many(
        "INSERT INTO fan_ops_groups (group_id, name, region, group_type, primary_contact, contact_email, member_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(g["group_id"], g["name"], g["region"], g["group_type"], g["primary_contact"], g["contact_email"], g["member_count"]) for g in FAN_GROUPS]
    )

    # Generate fans for each group
    all_fans = []
    for group in FAN_GROUPS:
        num_fans = min(group["member_count"], random.randint(15, 35))
        for _ in range(num_fans):
            fan_id = _gen_fan_id()
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            membership_id = _gen_membership_id()
            accessibility = random.choice([None, None, None, None, None, "wheelchair", "hearing_loop", "visual_impairment", "mobility_aid"]) if group["group_type"] == "accessibility" else random.choice([None] * 20 + ["wheelchair", "mobility_aid"])
            all_fans.append((fan_id, group["group_id"], name, membership_id, accessibility))

    execute_many(
        "INSERT INTO fan_ops_fans (fan_id, fan_group_id, name, membership_id, accessibility_needs) VALUES (?, ?, ?, ?, ?)",
        all_fans
    )

    # Generate ticket allocations per fixture
    all_tickets = []
    all_checkins = []

    for fixture in FIXTURES:
        fixture_date = datetime.strptime(fixture["date"], "%Y-%m-%d")
        is_past = fixture_date < datetime.now()

        for group in FAN_GROUPS:
            group_fans = [f for f in all_fans if f[1] == group["group_id"]]
            num_allocated = random.randint(min(8, len(group_fans)), len(group_fans))
            allocated_fans = random.sample(group_fans, num_allocated)

            stand = random.choice(STANDS)
            gate = random.choice(GATES)
            block = random.choice(BLOCKS)

            for fan_tuple in allocated_fans:
                fan_id = fan_tuple[0]
                ticket_id = _gen_ticket_id()
                row = random.choice("ABCDEFGHIJKLMNOP")
                seat = str(random.randint(1, 40))

                if is_past:
                    status = random.choices(["confirmed", "cancelled"], weights=[92, 8])[0]
                    payment = "paid" if status == "confirmed" else random.choice(["refunded", "paid"])
                else:
                    status = random.choices(["confirmed", "pending", "cancelled"], weights=[65, 28, 7])[0]
                    payment = "paid" if status == "confirmed" else ("unpaid" if status == "pending" else "refunded")

                all_tickets.append((ticket_id, fan_id, group["group_id"], fixture["match_id"], block, row, seat, status, payment, gate, stand))

                # Check-in events for past fixtures
                if is_past and status == "confirmed":
                    checked = random.choices([1, 0], weights=[88, 12])[0]
                    checkin_time = None
                    if checked:
                        hour = random.randint(13, 15) if fixture["kickoff"] == "15:00" else random.randint(15, 17)
                        minute = random.randint(0, 59)
                        checkin_time = fixture_date.replace(hour=hour, minute=minute).isoformat()
                    checkin_id = f"ci-{uuid.uuid4().hex[:8]}"
                    all_checkins.append((checkin_id, ticket_id, fan_id, fixture["match_id"], checked, checkin_time, gate))

    execute_many(
        "INSERT INTO fan_ops_ticket_allocations (ticket_id, fan_id, fan_group_id, fixture_id, seat_block, row, seat, ticket_status, payment_status, gate, stand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        all_tickets
    )

    if all_checkins:
        execute_many(
            "INSERT INTO fan_ops_checkin_events (checkin_id, ticket_id, fan_id, fixture_id, checked_in, checkin_time, gate) VALUES (?, ?, ?, ?, ?, ?, ?)",
            all_checkins
        )

    # Generate issues (some open, some resolved)
    all_issues = []
    for fixture in FIXTURES:
        num_issues = random.randint(2, 6)
        issue_groups = random.sample(FAN_GROUPS, num_issues)
        for group in issue_groups:
            issue_type = random.choice(ISSUE_TYPES)
            desc = random.choice(ISSUE_DESCRIPTIONS[issue_type])
            fixture_date = datetime.strptime(fixture["date"], "%Y-%m-%d")
            created = (fixture_date - timedelta(days=random.randint(1, 7))).isoformat()
            is_past = fixture_date < datetime.now()
            status = random.choice(["open", "resolved", "escalated"]) if is_past else random.choices(["open", "resolved"], weights=[70, 30])[0]
            resolved_at = (fixture_date - timedelta(hours=random.randint(1, 24))).isoformat() if status == "resolved" else None
            issue_id = f"iss-{uuid.uuid4().hex[:8]}"
            all_issues.append((issue_id, group["group_id"], fixture["match_id"], issue_type, desc, status, created, resolved_at))

    execute_many(
        "INSERT INTO fan_ops_group_issues (issue_id, fan_group_id, fixture_id, issue_type, description, status, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        all_issues
    )
