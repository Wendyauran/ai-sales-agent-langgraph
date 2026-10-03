from db.supabase_client import supabase
from langchain_core.tools import tool


@tool
def escalate(conversation_id: str, reason: str, lead_id: str | None = None) -> dict:
    """Escalate the conversation to a human agent, without forcing a bookin. Use when the request is complex, out of scope, or the user seems upset"""
    result = (
        supabase.table("escalations")
        .insert({
            "conversation_id": conversation_id,
            "lead_id": lead_id,
            "reason": reason,
            "status": "open"
        })
        .execute()
    )

    if lead_id:
        supabase.table("leads").update({"status": "escalated"}).eq("id", lead_id).execute()

    return {"escalation_id": result.data[0]["id"]}