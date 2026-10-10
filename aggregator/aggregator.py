
from aggregator import aggregate_results


# Test 1: No risk signals
pattern_result = {
    "flag": False,
    "explanation": "No strong pattern match found"
}

graph_result = {
    "entity_token": "PERSON_001",
    "ring_size": 0,
    "linked_tokens": []
}

person3_result = {
    "entity_token": "PERSON_001",
    "kyc_agent": {
        "match_found": False,
        "verdict": "NO MATCH"
    },
    "behavioral_agent": {
        "is_anomaly": False,
        "verdict": "NORMAL"
    }
}

result = aggregate_results(pattern_result, graph_result, person3_result)

print("Test 1:", result)

assert result["risk_score"] == 0
assert result["risk_level"] == "LOW"
assert result["entity_token"] == "PERSON_001"
assert result["signals"]["pattern_flag"] is False
assert len(result["evidence"]) == 1
assert result["human_review_required"] is False


# Test 2: All risk signals
pattern_result = {
    "flag": True,
    "explanation": "Strong similarity with a past fraud case"
}

graph_result = {
    "entity_token": "PERSON_001",
    "ring_size": 2,
    "linked_tokens": ["PERSON_004", "PERSON_007"]
}

person3_result = {
    "entity_token": "PERSON_001",
    "kyc_agent": {
        "match_found": True,
        "verdict": "WATCHLIST MATCH"
    },
    "behavioral_agent": {
        "is_anomaly": True,
        "verdict": "FLAGGED - unusual behavior"
    }
}

result = aggregate_results(pattern_result, graph_result, person3_result)

print("Test 2:", result)

assert result["risk_score"] == 100
assert result["risk_level"] == "HIGH"
assert result["signals"]["pattern_flag"] is True
assert result["signals"]["kyc_match"] is True
assert result["signals"]["behavioral_anomaly"] is True
assert len(result["evidence"]) == 4
assert len(result["linked_tokens"]) == 2
assert result["human_review_required"] is True


print("All aggregator tests passed!")
