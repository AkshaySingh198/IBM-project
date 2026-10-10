import os
import sys
import requests


# Project paths
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

PERSON3_DIR = os.path.join(
    BASE_DIR,
    "kyc-behavioral-agent"
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if PERSON3_DIR not in sys.path:
    sys.path.insert(1, PERSON3_DIR)


# Imports
from aggregator import aggregate_results
from ml_person3_agents import investigate_transaction


# Agent endpoints
PATTERN_URL = "http://127.0.0.1:8001/pattern-agent/analyze"
GRAPH_URL = "http://127.0.0.1:8001/graph-agent/linked/PERSON_001"


def run_integration_test():

    # Test transaction
    case = {
        "case_id": "TEST_001",
        "sender": "PERSON_001",
        "receiver": "PERSON_045",
        "amount": 50000,
        "narrative": (
            "High value transfer to new recipient "
            "from unusual device"
        ),
    }

    # 1. Pattern Agent
    pattern_response = requests.post(
        PATTERN_URL,
        json=case,
        timeout=10,
    )
    pattern_response.raise_for_status()
    pattern_result = pattern_response.json()

    assert isinstance(pattern_result, dict)

    print("PATTERN RESULT:")
    print(pattern_result)

    # 2. Graph Agent
    graph_response = requests.get(
        GRAPH_URL,
        timeout=10,
    )
    graph_response.raise_for_status()
    graph_result = graph_response.json()

    assert isinstance(graph_result, dict)

    print("\nGRAPH RESULT:")
    print(graph_result)

    # 3. Person 3: KYC and Behavioral Agent
    transaction = {
        "Amount": 50000,
        "FailedLoginAttempts": 5,
        "FilesAccessed": 30,
        "SessionDuration": 180,
        "AfterHoursAccess": 1,
        "ExternalDevice": 1,
    }

    person3_result = investigate_transaction(
        "PERSON_001",
        transaction,
    )

    assert isinstance(person3_result, dict)

    print("\nPERSON 3 RESULT:")
    print(person3_result)

    # 4. Aggregator
    aggregated_result = aggregate_results(
        pattern_result,
        graph_result,
        person3_result,
    )

    print("\nAGGREGATOR RESULT:")
    print(aggregated_result)

    # 5. Validate aggregated output
    assert isinstance(aggregated_result, dict)
    assert "risk_score" in aggregated_result
    assert isinstance(
        aggregated_result["risk_score"], (int, float)
    )
    assert aggregated_result.get("risk_level") in (
        "LOW",
        "MEDIUM",
        "HIGH",
    )
    assert isinstance(aggregated_result.get("signals"), dict)
    assert isinstance(aggregated_result.get("evidence"), list)
    assert isinstance(
        aggregated_result.get("recommended_next_action"), str
    )
    assert isinstance(
        aggregated_result.get("human_review_required"), bool
    )

    print("\nIntegration test passed: aggregated output is valid.")

    return aggregated_result


if __name__ == "__main__":
    run_integration_test()
