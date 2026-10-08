import asyncio
import uuid
from typing import Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Base, State, City, Plan
from app.db.session import AsyncSessionLocal, engine
from app.core.logging import logger

PLANS_DATA = [
    {"category": "cycles", "base_fee_paise": 9900, "duration_days": 365, "is_active": True},
    {"category": "bikes", "base_fee_paise": 99900, "duration_days": 365, "is_active": True},
    {"category": "cars", "base_fee_paise": 199900, "duration_days": 365, "is_active": True},
    {"category": "other", "base_fee_paise": 249900, "duration_days": 365, "is_active": True},
]

STATES_AND_CITIES: List[Dict[str, any]] = [
    {
        "code": "TN",
        "name": "Tamil Nadu",
        "slug": "tamil-nadu",
        "cities": [
            {"name": "Chennai", "slug": "chennai", "is_popular": True},
            {"name": "Coimbatore", "slug": "coimbatore", "is_popular": True},
            {"name": "Madurai", "slug": "madurai", "is_popular": False},
            {"name": "Tiruchirappalli", "slug": "trichy", "is_popular": False},
            {"name": "Salem", "slug": "salem", "is_popular": False},
        ],
    },
    {
        "code": "KA",
        "name": "Karnataka",
        "slug": "karnataka",
        "cities": [
            {"name": "Bengaluru", "slug": "bengaluru", "is_popular": True},
            {"name": "Mysuru", "slug": "mysuru", "is_popular": False},
            {"name": "Mangaluru", "slug": "mangaluru", "is_popular": False},
            {"name": "Hubballi", "slug": "hubballi", "is_popular": False},
        ],
    },
    {
        "code": "MH",
        "name": "Maharashtra",
        "slug": "maharashtra",
        "cities": [
            {"name": "Mumbai", "slug": "mumbai", "is_popular": True},
            {"name": "Pune", "slug": "pune", "is_popular": True},
            {"name": "Nagpur", "slug": "nagpur", "is_popular": False},
            {"name": "Nashik", "slug": "nashik", "is_popular": False},
            {"name": "Thane", "slug": "thane", "is_popular": False},
        ],
    },
    {
        "code": "DL",
        "name": "Delhi",
        "slug": "delhi",
        "cities": [
            {"name": "New Delhi", "slug": "delhi-ncr", "is_popular": True},
        ],
    },
    {
        "code": "TG",
        "name": "Telangana",
        "slug": "telangana",
        "cities": [
            {"name": "Hyderabad", "slug": "hyderabad", "is_popular": True},
            {"name": "Warangal", "slug": "warangal", "is_popular": False},
        ],
    },
    {
        "code": "KL",
        "name": "Kerala",
        "slug": "kerala",
        "cities": [
            {"name": "Kochi", "slug": "kochi", "is_popular": True},
            {"name": "Thiruvananthapuram", "slug": "thiruvananthapuram", "is_popular": False},
            {"name": "Kozhikode", "slug": "kozhikode", "is_popular": False},
        ],
    },
    {
        "code": "AP",
        "name": "Andhra Pradesh",
        "slug": "andhra-pradesh",
        "cities": [
            {"name": "Visakhapatnam", "slug": "visakhapatnam", "is_popular": True},
            {"name": "Vijayawada", "slug": "vijayawada", "is_popular": False},
        ],
    },
    {
        "code": "GJ",
        "name": "Gujarat",
        "slug": "gujarat",
        "cities": [
            {"name": "Ahmedabad", "slug": "ahmedabad", "is_popular": True},
            {"name": "Surat", "slug": "surat", "is_popular": False},
            {"name": "Vadodara", "slug": "vadodara", "is_popular": False},
        ],
    },
    {
        "code": "HR",
        "name": "Haryana",
        "slug": "haryana",
        "cities": [
            {"name": "Gurugram", "slug": "gurugram", "is_popular": True},
            {"name": "Faridabad", "slug": "faridabad", "is_popular": False},
        ],
    },
    {
        "code": "UP",
        "name": "Uttar Pradesh",
        "slug": "uttar-pradesh",
        "cities": [
            {"name": "Noida", "slug": "noida", "is_popular": True},
            {"name": "Lucknow", "slug": "lucknow", "is_popular": False},
            {"name": "Kanpur", "slug": "kanpur", "is_popular": False},
        ],
    },
    {
        "code": "WB",
        "name": "West Bengal",
        "slug": "west-bengal",
        "cities": [
            {"name": "Kolkata", "slug": "kolkata", "is_popular": True},
            {"name": "Howrah", "slug": "howrah", "is_popular": False},
        ],
    },
    {
        "code": "RJ",
        "name": "Rajasthan",
        "slug": "rajasthan",
        "cities": [
            {"name": "Jaipur", "slug": "jaipur", "is_popular": True},
            {"name": "Udaipur", "slug": "udaipur", "is_popular": False},
        ],
    },
    {
        "code": "PB",
        "name": "Punjab",
        "slug": "punjab",
        "cities": [
            {"name": "Chandigarh", "slug": "chandigarh", "is_popular": True},
            {"name": "Ludhiana", "slug": "ludhiana", "is_popular": False},
        ],
    },
    {
        "code": "MP",
        "name": "Madhya Pradesh",
        "slug": "madhya-pradesh",
        "cities": [
            {"name": "Indore", "slug": "indore", "is_popular": True},
            {"name": "Bhopal", "slug": "bhopal", "is_popular": False},
        ],
    },
    {
        "code": "OR",
        "name": "Odisha",
        "slug": "odisha",
        "cities": [
            {"name": "Bhubaneswar", "slug": "bhubaneswar", "is_popular": False},
        ],
    },
    {
        "code": "BR",
        "name": "Bihar",
        "slug": "bihar",
        "cities": [
            {"name": "Patna", "slug": "patna", "is_popular": False},
        ],
    },
    {
        "code": "AS",
        "name": "Assam",
        "slug": "assam",
        "cities": [
            {"name": "Guwahati", "slug": "guwahati", "is_popular": False},
        ],
    },
    {
        "code": "GA",
        "name": "Goa",
        "slug": "goa",
        "cities": [
            {"name": "Panaji", "slug": "panaji", "is_popular": False},
        ],
    },
    {
        "code": "CH",
        "name": "Chandigarh (UT)",
        "slug": "chandigarh-ut",
        "cities": [
            {"name": "Chandigarh UT", "slug": "chandigarh-city", "is_popular": False},
        ],
    },
    {
        "code": "PY",
        "name": "Puducherry (UT)",
        "slug": "puducherry",
        "cities": [
            {"name": "Puducherry", "slug": "puducherry-city", "is_popular": False},
        ],
    },
    {
        "code": "JK",
        "name": "Jammu & Kashmir",
        "slug": "jammu-and-kashmir",
        "cities": [
            {"name": "Srinagar", "slug": "srinagar", "is_popular": False},
            {"name": "Jammu", "slug": "jammu", "is_popular": False},
        ],
    },
    {
        "code": "UT",
        "name": "Uttarakhand",
        "slug": "uttarakhand",
        "cities": [
            {"name": "Dehradun", "slug": "dehradun", "is_popular": False},
        ],
    },
    {
        "code": "HP",
        "name": "Himachal Pradesh",
        "slug": "himachal-pradesh",
        "cities": [
            {"name": "Shimla", "slug": "shimla", "is_popular": False},
        ],
    },
    {
        "code": "JH",
        "name": "Jharkhand",
        "slug": "jharkhand",
        "cities": [
            {"name": "Ranchi", "slug": "ranchi", "is_popular": False},
            {"name": "Jamshedpur", "slug": "jamshedpur", "is_popular": False},
        ],
    },
    {
        "code": "CT",
        "name": "Chhattisgarh",
        "slug": "chhattisgarh",
        "cities": [
            {"name": "Raipur", "slug": "raipur", "is_popular": False},
        ],
    },
    {
        "code": "TR",
        "name": "Tripura",
        "slug": "tripura",
        "cities": [
            {"name": "Agartala", "slug": "agartala", "is_popular": False},
        ],
    },
    {
        "code": "MN",
        "name": "Manipur",
        "slug": "manipur",
        "cities": [
            {"name": "Imphal", "slug": "imphal", "is_popular": False},
        ],
    },
    {
        "code": "ML",
        "name": "Meghalaya",
        "slug": "meghalaya",
        "cities": [
            {"name": "Shillong", "slug": "shillong", "is_popular": False},
        ],
    },
    {
        "code": "MZ",
        "name": "Mizoram",
        "slug": "mizoram",
        "cities": [
            {"name": "Aizawl", "slug": "aizawl", "is_popular": False},
        ],
    },
    {
        "code": "NL",
        "name": "Nagaland",
        "slug": "nagaland",
        "cities": [
            {"name": "Kohima", "slug": "kohima", "is_popular": False},
        ],
    },
    {
        "code": "SK",
        "name": "Sikkim",
        "slug": "sikkim",
        "cities": [
            {"name": "Gangtok", "slug": "gangtok", "is_popular": False},
        ],
    },
    {
        "code": "AR",
        "name": "Arunachal Pradesh",
        "slug": "arunachal-pradesh",
        "cities": [
            {"name": "Itanagar", "slug": "itanagar", "is_popular": False},
        ],
    },
    {
        "code": "LA",
        "name": "Ladakh (UT)",
        "slug": "ladakh",
        "cities": [
            {"name": "Leh", "slug": "leh", "is_popular": False},
        ],
    },
    {
        "code": "AN",
        "name": "Andaman & Nicobar Islands (UT)",
        "slug": "andaman-and-nicobar",
        "cities": [
            {"name": "Port Blair", "slug": "port-blair", "is_popular": False},
        ],
    },
    {
        "code": "DN",
        "name": "Dadra and Nagar Haveli and Daman and Diu (UT)",
        "slug": "dadra-nagar-haveli-daman-diu",
        "cities": [
            {"name": "Daman", "slug": "daman", "is_popular": False},
        ],
    },
    {
        "code": "LD",
        "name": "Lakshadweep (UT)",
        "slug": "lakshadweep",
        "cities": [
            {"name": "Kavaratti", "slug": "kavaratti", "is_popular": False},
        ],
    },
]


async def seed_plans(session: AsyncSession) -> None:
    """Seeds the 4 listing plans (Cycles, Bikes, Cars, Other)."""
    for plan_dict in PLANS_DATA:
        result = await session.execute(select(Plan).where(Plan.category == plan_dict["category"]))
        existing = result.scalar_one_or_none()
        if not existing:
            plan = Plan(
                category=plan_dict["category"],
                base_fee_paise=plan_dict["base_fee_paise"],
                duration_days=plan_dict["duration_days"],
                is_active=plan_dict["is_active"],
            )
            session.add(plan)
            logger.info(f"Seeded plan: {plan_dict['category']} ({plan_dict['base_fee_paise']} paise)")
    await session.commit()


async def seed_states_and_cities(session: AsyncSession) -> None:
    """Seeds Indian states, union territories, and their major cities."""
    for state_data in STATES_AND_CITIES:
        result = await session.execute(select(State).where(State.code == state_data["code"]))
        state = result.scalar_one_or_none()
        if not state:
            state = State(
                code=state_data["code"],
                name=state_data["name"],
                slug=state_data["slug"],
            )
            session.add(state)
            await session.flush()
            logger.info(f"Seeded state: {state.name} ({state.code})")

        for city_data in state_data.get("cities", []):
            city_res = await session.execute(
                select(City).where(City.state_id == state.id, City.slug == city_data["slug"])
            )
            city = city_res.scalar_one_or_none()
            if not city:
                city = City(
                    state_id=state.id,
                    name=city_data["name"],
                    slug=city_data["slug"],
                    is_popular=city_data.get("is_popular", False),
                )
                session.add(city)
                logger.info(f"  Seeded city: {city.name} under {state.name}")

    await session.commit()


async def run_seed() -> None:
    """Runs all seed operations inside a database session."""
    logger.info("Starting database seed...")
    async with AsyncSessionLocal() as session:
        await seed_plans(session)
        await seed_states_and_cities(session)
    logger.info("Database seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(run_seed())
