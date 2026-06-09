import logging
from typing import List
from rag.vectorstore import get_collection

logger = logging.getLogger(__name__)


def index_documents(docs: List[dict]) -> None:
    """docs: list of {"id": str, "text": str, "metadata": dict}"""
    collection = get_collection()
    collection.upsert(
        ids=[d["id"] for d in docs],
        documents=[d["text"] for d in docs],
        metadatas=[d.get("metadata", {}) for d in docs],
    )
    logger.info(f"[RAG] Indexed {len(docs)} documents. Total: {collection.count()}")
