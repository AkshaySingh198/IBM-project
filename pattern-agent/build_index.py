import chromadb
from sentence_transformers import SentenceTransformer
from fake_data import FAKE_CASES

def build_index():
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="fraud_cases")

    model = SentenceTransformer("all-MiniLM-L6-v2")

    narratives = [case["narrative"] for case in FAKE_CASES]
    embeddings = model.encode(narratives).tolist()

    ids = [case["case_id"] for case in FAKE_CASES]
    metadatas = [
        {
            "sender": case["sender"],
            "receiver": case["receiver"],
            "amount": case["amount"],
            "narrative": case["narrative"]
        }
        for case in FAKE_CASES
    ]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=narratives
    )

    print(f"Indexed {len(FAKE_CASES)} fraud cases into ChromaDB.")

if __name__ == "__main__":
    build_index()