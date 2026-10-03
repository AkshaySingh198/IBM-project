import requests
from aggregator import aggregate_results


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


# Temporary Person 3 result
# Will be replaced with the real KYC + Behavioral Agent output later.
person3_result = {
    "kyc_agent": {
        "match_found": False
    },
    "behavioral_agent": {
        "is_anomaly": False
    }
}


# Aggregator
aggregated_result = aggregate_results(
    pattern_result,
    graph_result,
    person3_result
)

print("\nAGGREGATOR RESULT:")
print(aggregated_result)
