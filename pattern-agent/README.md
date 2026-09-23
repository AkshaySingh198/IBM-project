\# Pattern Agent + Graph Agent



Part of the Zero-Exposure Fraud Investigation Copilot. This module handles the RAG-based Pattern Agent and the Graph-based network analysis agent — both operate entirely on tokenized data (no raw PII).



\## What this does



1\. \*\*Pattern Agent (RAG)\*\* — takes a tokenized case narrative, embeds it, retrieves similar past fraud cases from a vector store, and generates a human-readable explanation of why (or why not) it's flagged.

2\. \*\*Graph Agent\*\* — detects fraud rings by linking tokens (senders, receivers, devices, IPs) that co-occur across cases.



\## Setup



pip install -r requirements.txt

python build\_index.py

uvicorn main:app --reload --port 8001



Docs available at: `http://127.0.0.1:8001/docs`



\## Endpoints



\### POST /pattern-agent/analyze

Input:

```json

{

&#x20; "case\_id": "CASE\_100",

&#x20; "sender": "PERSON\_001",

&#x20; "receiver": "PERSON\_002",

&#x20; "amount": 50000,

&#x20; "narrative": "Large transfer to new recipient, unusual location"

}

```

Output: matched past cases, similarity scores, flag (true/false), and a readable explanation.



\### GET /graph-agent/linked/{entity\_token}

Example: `/graph-agent/linked/PERSON\_001`

Output: list of tokens linked via shared device/IP/receiver, and ring size — used to detect fraud rings.



\## Files

\- `fake\_data.py` — sample tokenized fraud cases (swap for real tokenized data once available)

\- `build\_index.py` — embeds and indexes cases into ChromaDB

\- `pattern\_agent.py` — similarity search + explanation generation

\- `graph\_agent.py` — fraud-ring detection via graph traversal

\- `main.py` — FastAPI app exposing both agents



\## Notes for integration (Aggregator Agent)

Both endpoints return `"error": null` on success, or an error message string if something failed — check this field before using the response.

