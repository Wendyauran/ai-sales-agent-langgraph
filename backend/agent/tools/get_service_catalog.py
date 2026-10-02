import json
from pathlib import Path
from langchain_core.tools import tool

CATALOG_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "service_catalog.json"

with open(CATALOG_PATH, encoding="utf-8") as f:
    _CATALOG_DATA = json.load(f)


@tool
def get_service_catalog() -> dict:
    """Get the agency's service catalog, including each service's name, description, price range, and estimated duration"""
    return _CATALOG_DATA