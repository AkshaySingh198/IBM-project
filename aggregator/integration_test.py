 
import os
import sys
import requests

from aggregator import aggregate_results


# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERSON3_DIR = os.path.join(BASE_DIR, "kyc-behavioral-agent")

sys.path.insert(0, PERSON3_DIR)

from ml_person3_agents import investigate_transaction


# Agent URLs
PATTERN_URL = "http://127.0.0.1:8001/pattern-agent/analyze"
GRAPH_URL = "http://127.0.0.1:8001/graph-agent/linked/PERSON_001"


# Test case
case = {
    "case_id": "TEST_001",
    "sender": "PERSON_001",
    "receiver": "PERSON_045",
    "amount": 50000,
    "narrative": "High value transfer to new recipient from unusual device"
}


# 1. Pattern Agent
pattern_response = requests.post(
    PATTERN_URL,
    json=case,
    timeout=10
)
pattern_response.raise_for_status()
pattern_result = pattern_response.json()

print("PATTERN RESULT:")
print(pattern_result)


# 2. Graph Agent
graph_response = requests.get(
    GRAPH_URL,
    timeout=10
)
graph_response.raise_for_status()
graph_result = graph_response.json()

print("\nGRAPH RESULT:")
print(graph_result)


# 3. Person 3: KYC + Behavioral Agent
transaction = {
    "Amount": 50000,
    "FailedLoginAttempts": 5,
    "FilesAccessed": 30,
    "SessionDuration": 180,
    "AfterHoursAccess": 1,
    "ExternalDevice": 1
}

person3_result = investigate_transaction(
    "PERSON_001",
    transaction
)

print("\nPERSON 3 RESULT:")
print(person3_result)


# 4. Aggregator
aggregated_result = aggregate_results(
    pattern_result,
    graph_result,
    person3_result
)

print("\nAGGREGATOR RESULT:")
print(aggregated_result)
