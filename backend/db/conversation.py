from agent.state import LeadInfo
from db.supabase_client import supabase
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage


# ========================
# LOAD MESSAGES HISTORY
# ========================
def load_message_history(conversation_id: str) -> list[BaseMessage]:
    rows = (
        supabase.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )

    history: list[BaseMessage] = []
    for row in rows.data:
        if row["role"] == "user":
            history.append(HumanMessage(content=row["content"]))
        elif row["role"] == "assistant":
            history.append(AIMessage(content=row["content"]))

    return history


# ====================
# LOAD LEAD HISTORY
# ====================
def load_lead_context(conversation_id: str) -> tuple[LeadInfo, str | None]:
    result = (
        supabase.table("leads")
        .select("id, name, business_type, budget_range, timeline")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        return LeadInfo(), None

    row = result.data[0]
    lead_info = LeadInfo(
        name=row["name"],
        business_type=row["business_type"],
        budget_range=row["budget_range"],
        timeline=row["timeline"]
    )
    return lead_info, row["id"]


# ==============
# SAVE TURN
# ==============
def save_turn(conversation_id: str, lead_id: str | None, user_message: str, assistant_reply: str) -> None:
    supabase.table("messages").insert([
        {"conversation_id": conversation_id, "lead_id": lead_id, "role": "user", "content": user_message},
        {"conversation_id": conversation_id, "lead_id": lead_id, "role": "assistant", "content": assistant_reply}
    ]).execute()

