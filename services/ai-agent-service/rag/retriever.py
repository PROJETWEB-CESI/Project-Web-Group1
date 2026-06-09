from typing import List
from rag.vectorstore import get_collection


def retrieve(query: str, n_results: int = 3) -> List[str]:
    collection = get_collection()
    count = collection.count()
    if count == 0:
        return []
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, count),
    )
    return results["documents"][0] if results["documents"] else []
