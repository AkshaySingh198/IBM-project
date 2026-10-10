import os
import sys
import requests


# --------------------------------------------------
# 1. PROJECT PATHS AND IMPORTS
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

# Ensure the repository root is searched first.
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
else:
    sys.path.remove(BASE_DIR)
    sys.path.insert(0, BASE_DIR)

PERSON3_DIR = os.path.join(
    BASE_DIR, "kyc-behavioral-agent"
)

if PERSON3_DIR not in sys.path:
    sys.path.insert(1, PERSON3_DIR)

from aggregator.aggregator import aggregate_results
from ml_person3_agents import investigate_transaction


# --------------------------------------------------
# 2. AGENT ENDPOINTS
# --------------------------------------------------

PATTERN_URL = (
    "http://127.0.0.1:8001/pattern-agent/analyze"
)

GRAPH_URL = (
    "http://127.0.0.1:8001/graph-agent/linked/PERSON_001"
)


# --------------------------------------------------
# 3. INTEGRATION TEST
# --------------------------------------------------

def run_integration_test():

    # Transaction case
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

    # Pattern Agent
    pattern_response = requests.post(
        PATTERN_URL,
        json=case,
        timeout=10,
    )
    pattern_response.raise_for_status()

    pattern_result = pattern_response.json()

    assert isinstance(pattern_result, dict), (
        "Pattern Agent must return a JSON object"
    )

    print("PATTERN RESULT:")
    print(pattern_result)

    # Graph Agent
    graph_response = requests.get(
        GRAPH_URL,
        timeout=10,
    )
    graph_response.raise_for_status()

    graph_result = graph_response.json()

    assert isinstance(graph_result, dict), (
        "Graph Agent must return a JSON object"
    )

    print("\nGRAPH RESULT:")
    print(graph_result)

    # Person 3: KYC + Behavioral Agent
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

    assert isinstance(person3_result, dict), (
        "Person 3 must return a dictionary"
    )

    print("\nPERSON 3 RESULT:")
    print(person3_result)

    # Aggregator
    aggregated_result = aggregate_results(
        pattern_result,
        graph_result,
        person3_result,
    )

    print("\nAGGREGATOR RESULT:")
    print(aggregated_result)

    # Validate the combined output
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

    assert isinstance(
        aggregated_result.get("signals"), dict
    )

    assert isinstance(
        aggregated_result.get("evidence"), list
    )

    assert isinstance(
        aggregated_result.get(
            "recommended_next_action"
        ),
        str,
    )

    assert isinstance(
        aggregated_result.get(
            "human_review_required"
        ),
        bool,
    )

    print(
        "\nIntegration test passed: "
        "all agent outputs were aggregated successfully."
    )

    return aggregated_result


if __name__ == "__main__":
    run_integration_test()
