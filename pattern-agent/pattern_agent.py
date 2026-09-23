import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="fraud_cases")

def generate_explanation(narrative: str, matched_cases: list, flag: bool) -> str:
    if not matched_cases:
        return "No similar past cases found. Insufficient evidence to flag this transaction."

    top = matched_cases[0]

    if not flag:
        return (
            f"This transaction shows only weak similarity (top match "
            f"{top['similarity_percent']}%) to past fraud cases. "
            f"No strong pattern match found — not flagged."
        )

    other_matches = matched_cases[1:3]
    other_text = ""
    if other_matches:
        other_text = " Additional supporting matches: " + "; ".join(
            f"{m['case_id']} ({m['similarity_percent']}%)" for m in other_matches
        )

    explanation = (
        f"Flagged: this transaction closely resembles {top['case_id']} "
        f"({top['similarity_percent']}% similarity) — \"{top['narrative']}\"."
        f"{other_text}"
    )
    return explanation


def analyze_case(narrative: str, top_k: int = 3):
    try:
        if not narrative or not narrative.strip():
            return {
                "matched_cases": [],
                "flag": False,
                "explanation": "No narrative provided — cannot analyze an empty case.",
                "error": None
            }

        query_embedding = model.encode([narrative]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )

        if not results["ids"] or not results["ids"][0]:
            return {
                "matched_cases": [],
                "flag": False,
                "explanation": "No past cases available to compare against.",
                "error": None
            }

        matched_cases = []
        for i in range(len(results["ids"][0])):
            case_id = results["ids"][0][i]
            distance = results["distances"][0][i]
            similarity = round((1 - distance) * 100, 2)
            metadata = results["metadatas"][0][i]

            matched_cases.append({
                "case_id": case_id,
                "similarity_percent": similarity,
                "narrative": metadata.get("narrative", "N/A"),
                "amount": metadata.get("amount", 0)
            })

        flag = any(m["similarity_percent"] > 55 for m in matched_cases)
        explanation = generate_explanation(narrative, matched_cases, flag)

        return {
            "matched_cases": matched_cases,
            "flag": flag,
            "explanation": explanation,
            "error": None
        }

    except Exception as e:
        return {
            "matched_cases": [],
            "flag": False,
            "explanation": "An error occurred while analyzing this case.",
            "error": str(e)
        }