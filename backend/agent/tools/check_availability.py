from datetime import datetime, timedelta
from langchain_core.tools import tool

MOCK_SLOT_HOURS = [9, 11, 14, 16]


@tool
def check_availability(days_ahead: int = 5) -> list[str]:
    """Check availability meeting slots for the next few business days. Currently mocked (not a real calendar). Returns a list of ISO datetime strings"""
    slots = []
    day_offset = 1
    checked_days = 0

    while checked_days < days_ahead:
        candidate = datetime.now() + timedelta(days=day_offset)
        day_offset += 1

        # Skip weekends (Saturday or Sunday)
        if candidate.weekday() >= 5:
            continue

        for hour in MOCK_SLOT_HOURS:
            slot = candidate.replace(hour=hour, minute=0, second=0, microsecond=0)
            slots.append(slot.isoformat())

        checked_days += 1
    return slots