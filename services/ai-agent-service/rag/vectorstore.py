import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from agent.config import CHROMA_PERSIST_DIR

_collection = None


def get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = client.get_or_create_collection(
            name="nova_knowledge",
            embedding_function=DefaultEmbeddingFunction(),
        )
    return _collection
