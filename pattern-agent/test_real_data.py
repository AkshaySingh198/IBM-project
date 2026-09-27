import json
import requests

with open("real_transactions.json", "r") as f:
    data = json.load(f)

transactions = data["tokenized_transactions"]

print(f"Testing {len(transactions)} real tokenized transactions against Pattern Agent...\n")

for i, txn in enumerate(transactions):
    payload = {
        "case_id": f"REAL_{i+1}",
        "sender": "UNKNOWN",
        "receiver": "UNKNOWN",
        "amount": 0,
        "narrative": txn["tokenized"]
    }
    try:
        response = requests.post("http://127.0.0.1:8001/pattern-agent/analyze", json=payload, timeout=10)
        result = response.json()
        print(f"--- {payload['case_id']} ---")
        print(f"Input: {txn['tokenized']}")
        print(f"Flag: {result.get('flag')}")
        print(f"Explanation: {result.get('explanation')}")
        print()
    except Exception as e:
        print(f"--- {payload['case_id']} ---")
        print(f"ERROR: {e}\n")

print("Done testing all real transactions.")