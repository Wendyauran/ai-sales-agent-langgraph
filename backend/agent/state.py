from typing import Annotated, Literal, Optional
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class LeadInfo(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None


class AgentState(BaseModel):
    conversation_id: str
    messages: Annotated[list[BaseMessage], add_messages] = Field(default_factory=list)
    intent: Optional[Literal["qualify", "faq", "escalate", "general"]] = None
    lead_info: LeadInfo = Field(default_factory=LeadInfo)
    lead_id: Optional[str] = None
    escalation_reason: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True