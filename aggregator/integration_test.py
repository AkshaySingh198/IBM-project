import requests

PATTERN_URL = "http://127.0.0.1:8001/pattern-agent/analyze"
GRAPH_URL = "http://127.0.0.1:8001/graph-agent/linked/PERSON_001"

case = {
    "case_id": "TEST_001",
    "sender": "PERSON_001",
    "receiver": "PERSON_045",
    "amount": 50000,
    "narrative": "High value transfer to new recipient from unusual device"
}

# Pattern Agent
pattern_response = requests.post(
    PATTERN_URL,
    json=case,
    timeout=10
)

pattern_result = pattern_response.json()

print("PATTERN RESULT:")
print(pattern_result)


# Graph Agent
graph_response = requests.get(
    GRAPH_URL,
    timeout=10
)

graph_result = graph_response.json()

print("\nGRAPH RESULT:")
print(graph_result)
