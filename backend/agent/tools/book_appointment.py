from db.supabase_client import supabase
from langchain_core.tools import tool


@tool
def book_appointment(lead_id: str, scheduled_at: str, duration_minutes: int = 30) -> dict:
    """Book a meeting slot for a qulified lead and record it"""
    result = (
        supabase.table("bookings")
        .insert({
            "lead_id": lead_id,
            "scheduled_at": scheduled_at,
            "duration_minutes": duration_minutes,
            "status": "scheduled"
        })
        .execute()
    )

    supabase.table("leads").update({"status": "booked"}).eq("id", lead_id).execute()
    return {"booking_id": result.data[0]["id"], "scheduled_at": scheduled_at}