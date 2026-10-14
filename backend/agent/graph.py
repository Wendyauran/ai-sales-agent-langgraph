import os
from typing import Literal

from dotenv import load_dotenv
from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from agent.state import AgentState, LeadInfo
from agent.tools.book_appointment import book_appointment
from agent.tools.check_availability import check_availability
from agent.tools.escalate import escalate
from agent.tools.get_service_catalog import get_service_catalog
from agent.tools.save_lead import save_lead
from agent.tools.search_faq import search_faq

load_dotenv()

llm_light = ChatGoogleGenerativeAI(model=os.environ["GEMINI_MODEL_LIGHT"])
llm_heavy = ChatGoogleGenerativeAI(model=os.environ["GEMINI_MODEL_HEAVY"])


# ============
# ROUTER
# ============
class RouteDecision(BaseModel):
    intent: Literal["qualify", "faq", "escalate", "general"]


ROUTER_SYSTEM_PROMPT = """You classify the latest user message in a web agency sales chat into exactly one category:
- qualify: user shows interest in agency services, discusses project needs, budget, or timeline, or wants to book a meeting.
- faq: user asks a general question about the agency's process, payment, warranty, or similar.
- escalate: user is angry, frustrated, explicitly asks for a human, or the request is clearly outside the agency's scope.
- general: greetings, small talk, or anything that doesn't fit the categories above."""


def router_node(state: AgentState) -> dict:
    structured_llm = llm_light.with_structured_output(RouteDecision)
    decision = structured_llm.invoke(
        [SystemMessage(content=ROUTER_SYSTEM_PROMPT), *state.messages]
    )
    return {"intent": decision.intent}


# ============
# QUALIFY
# ============
QUALIFY_SYSTEM_PROMPT = """You are a friendly sales assistant for a web agency. 
Your goal is to naturally understand the prospective client's needs by gathering these details over the conversation:
- name
- business_type (what kind of business/industry they run)
- budget_range (their rough budget)
- timeline (when they need the website done)

Do not interrogate the user with a rigid checklist. Ask naturally, one or two things at a time, and only ask about what is still missing below.

Known information so far:
{lead_info_summary}

This conversation's conversation_id is: {conversation_id}
Always pass this exact conversation_id whenever you call save_lead.
{lead_id_note}

Tools available to you:
- get_service_catalog: to answer questions about services and pricing.
- save_lead: call this whenever you learn new information, even if not all fields are known yet.
- check_availability: to see open meeting slots once the client is ready to book.
- book_appointment: to confirm a meeting once the client has picked a slot.

If the client's needs are clearly outside what the agency offers, or they seem frustrated, do not keep pushing qualification."""


def _format_lead_info(lead_info: LeadInfo) -> str:
    fields = {
        "name": lead_info.name,
        "business_type": lead_info.business_type,
        "budget_range": lead_info.budget_range,
        "timeline": lead_info.timeline,
    }
    lines = [f"- {key}: {value or 'unknown'}" for key, value in fields.items()]
    return "\n".join(lines)


qualify_tools_list = [get_service_catalog, check_availability, save_lead, book_appointment]
qualify_tools = ToolNode(qualify_tools_list)


def qualify_agent_node(state: AgentState) -> dict:
    llm_with_tools = llm_heavy.bind_tools(qualify_tools_list)
    lead_id_note = (
        f"This lead's lead_id is: {state.lead_id}. Pass this exact lead_id when calling book_appointment." if state.lead_id
        else "No lead_id yet — call save_lead first before attempting to book an appointment."
    )
    system_prompt = QUALIFY_SYSTEM_PROMPT.format(
        lead_info_summary=_format_lead_info(state.lead_info),
        conversation_id=state.conversation_id,
        lead_id_note=lead_id_note
    )
    response = llm_with_tools.invoke(
        [SystemMessage(content=system_prompt), *state.messages]
    )
    return {"messages": [response]}


# =========
# FAQ
# =========
FAQ_SYSTEM_PROMPT = """You are support assistant for a web agency. Answer the user's question using the search_faq tool to find the agency's official answer. If the tool return found=False, say you don't have an official answer for that and suggest escalating to a human instead of guessing."""


faq_tools_list = [search_faq]
faq_tools = ToolNode(faq_tools_list)


def faq_agent_node(state: AgentState) -> dict:
    llm_with_tools = llm_light.bind_tools(faq_tools_list)
    response = llm_with_tools.invoke(
        [SystemMessage(content=FAQ_SYSTEM_PROMPT), *state.messages]
    )
    return {"messages": [response]}


# ============
# ESCALATE
# ============
ESCALATE_SYSTEM_PROMPT = """You are handling a conversation that needs to be escalated to a human agent. Call the escalate tool with a clear, concise reasin based on the conversation, then let the user know a team member will follow up soon. Do not try to push a booking or keep qualifying the client.

This conversations's conversation_id is: {conversation_id}
Always pass this exact conversation_id when calling escalate.
{lead_id_note}"""


escalate_tools_list = [escalate]
escalate_tools = ToolNode(escalate_tools_list)


def escalate_agent_node(state: AgentState) -> dict:
    llm_with_tools = llm_light.bind_tools(escalate_tools_list)
    lead_id_note = (
        f"This conversation's lead_id is: {state.lead_id}. Pass this exact lead_id when calling escalate." if state.lead_id
        else "No lead_id exists yet for this conversation — omit lead_id when calling escalate."
    )
    system_prompt = ESCALATE_SYSTEM_PROMPT.format(
        conversation_id=state.conversation_id,
        lead_id_note=lead_id_note
    )
    response = llm_with_tools.invoke(
        [SystemMessage(content=system_prompt), *state.messages]
    )
    return {"messages": [response]}


# ============
# GENARAL
# ============
GENARAL_SYSTEM_PROMPT = """You are a friendly assistant for a web agency's sales chat. Respond briefly and warmly to greetings or small talk, and gently steer the conversation toward asking what kind of website or project the user is looking for.
"""


def general_node(state: AgentState) -> dict:
    response = llm_light.invoke(
        [SystemMessage(content=GENARAL_SYSTEM_PROMPT), *state.messages]
    )
    return {"messages": [response]}


# ==============
# BUILD GRAPH
# ==============
graph = StateGraph(AgentState)

graph.add_node("router", router_node)
graph.add_node("qualify_agent", qualify_agent_node)
graph.add_node("qualify_tools", qualify_tools)
graph.add_node("faq_agent", faq_agent_node)
graph.add_node("faq_tools", faq_tools)
graph.add_node("escalate_agent", escalate_agent_node)
graph.add_node("escalate_tools", escalate_tools)
graph.add_node("general_agent", general_node)

graph.add_edge(START, "router")

graph.add_conditional_edges(
    "router",
    lambda state: state.intent,
    {
        "qualify": "qualify_agent",
        "faq": "faq_agent",
        "escalate": "escalate_agent",
        "general": "general_agent"
    }
)

graph.add_conditional_edges("qualify_agent", tools_condition, {"tools": "qualify_tools", END: END})
graph.add_edge("qualify_tools", "qualify_agent")

graph.add_conditional_edges("faq_agent", tools_condition, {"tools": "faq_tools", END: END})
graph.add_edge("faq_tools", "faq_agent")

graph.add_conditional_edges("escalate_agent", tools_condition, {"tools": "escalate_tools", END: END})
graph.add_edge("escalate_tools", "escalate_agent")

graph.add_edge("general_agent", END)

app = graph.compile()