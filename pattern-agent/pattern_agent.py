import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="fraud_cases")

def analyze_case(narrative: str, top_k: int = 3):
    query_embedding = model.encode([narrative]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )

    matched_cases = []
    for i in range(len(results["ids"][0])):
        case_id = results["ids"][0][i]
        distance = results["distances"][0][i]
        similarity = round((1 - distance) * 100, 2)
        metadata = results["metadatas"][0][i]

        matched_cases.append({
            "case_id": case_id,
            "similarity_percent": similarity,
            "narrative": metadata["narrative"],
            "amount": metadata["amount"]
        })

    flag = any(m["similarity_percent"] > 70 for m in matched_cases)

    return {
        "matched_cases": matched_cases,
        "flag": flag
    }