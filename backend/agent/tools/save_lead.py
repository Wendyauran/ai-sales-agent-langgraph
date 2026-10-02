from db.supabase_client import supabase
from langchain_core.tools import tool


@tool
def save_lead(
    conversation_id: str,
    name: str | None = None,
    business_type: str | None = None,
    budget_range: str | None = None,
    timeline: str | None = None
) -> dict:
    """Save or update qualified lead's contact and requirement info into the CRM"""
    existing = supabase.table("leads").select("id").eq("conversation_id", conversation_id).limit(1).execute()

    payload = {
        "conversation_id": conversation_id,
        "name": name,
        "business_type": business_type,
        "budget_range": budget_range,
        "timeline": timeline,
        "status": "qualified"
    }

    if existing.data:
        lead_id = existing.data[0]["id"]
        supabase.table("leads").update(payload).eq("id", lead_id).execute()
    else:
        result = supabase.table("leads").insert(payload).execute()
        lead_id = result.data[0]["id"]

    return {"lead_id": lead_id}