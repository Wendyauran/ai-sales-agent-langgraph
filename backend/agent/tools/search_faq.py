import json
import re
from pathlib import Path
from langchain_core.tools import tool

FAQ_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "faq.json"

with open(FAQ_PATH, encoding="utf-8") as f:
    _FAQ_DATA = json.load(f)

def _keyword_matches(keyword: str, text:str) -> bool:
    pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
    return re.search(pattern, text.lower()) is not None

@tool
def search_faq(query: str) -> dict:
    """Search the FAQ knowledge base for an answer matching the user's question, using keyword matching"""
    best_knowledge = None
    best_score = 0

    for knowledge in _FAQ_DATA:
        score = sum(1 for kw in knowledge["keywords"] if _keyword_matches(kw, query))
        if score > best_score:
            best_score = score
            best_knowledge = knowledge

    if best_knowledge is None:
        return {"faq_found": False, "answer": None}

    return {"faq_found": True, "faq_id": best_knowledge["id"], "answer": best_knowledge["answer"]}