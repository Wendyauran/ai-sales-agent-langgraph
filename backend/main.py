import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from db.conversation import load_message_history, load_lead_context, save_turn
from agent.graph import app as agent_app
from agent.state import AgentState

api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str


# ================================
# HELPER: EXTRACT RESPONSE TEXT
# ================================
def _extract_text(content) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block["text"])
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)

    return str(content)


# =================
# ENDPOINT /chat
# =================
@api.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    conversation_id = request.conversation_id or str(uuid.uuid4())

    history = load_message_history(conversation_id)
    lead_info, lead_id = load_lead_context(conversation_id)

    initial_state = AgentState(
        conversation_id=conversation_id,
        messages=[*history, HumanMessage(content=request.message)],
        lead_info=lead_info,
        lead_id=lead_id
    )

    result = agent_app.invoke(initial_state)
    final_state = AgentState(**result)

    reply_text = _extract_text(final_state.messages[-1].content).strip()

    if not reply_text:
        reply_text = "Mohon maaf, kami belum bisa memberikan jawaban yang pasti. Mohon tunggu sebentar."

    save_turn(conversation_id, final_state.lead_id, request.message, reply_text)
    return ChatResponse(conversation_id=conversation_id, reply=reply_text)