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
assert len(result["evidence"]) == 1


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
assert result["pattern_flag"] is True
assert result["kyc_match"] is True
assert result["behavioral_anomaly"] is True
assert len(result["evidence"]) == 4
assert len(result["linked_tokens"]) == 2


# Test 3: Pattern signal only
result = aggregate_results(
    {"flag": True, "explanation": "Pattern detected"},
    {"entity_token": "PERSON_001", "ring_size": 0, "linked_tokens": []},
    {
        "entity_token": "PERSON_001",
        "kyc_agent": {"match_found": False},
        "behavioral_agent": {"is_anomaly": False}
    }
)

print("Test 3:", result)
assert result["risk_score"] == 30
assert result["risk_level"] == "MEDIUM"


# Test 4: Behavioral anomaly only
result = aggregate_results(
    {"flag": False},
    {"entity_token": "PERSON_001", "ring_size": 0, "linked_tokens": []},
    {
        "entity_token": "PERSON_001",
        "kyc_agent": {"match_found": False},
        "behavioral_agent": {
            "is_anomaly": True,
            "verdict": "Unusual behavior"
        }
    }
)

print("Test 4:", result)
assert result["risk_score"] == 30
assert result["risk_level"] == "MEDIUM"


# Test 5: Graph signal only
result = aggregate_results(
    {"flag": False},
    {
        "entity_token": "PERSON_001",
        "ring_size": 2,
        "linked_tokens": ["PERSON_004"]
    },
    {
        "entity_token": "PERSON_001",
        "kyc_agent": {"match_found": False},
        "behavioral_agent": {"is_anomaly": False}
    }
)

print("Test 5:", result)
assert result["risk_score"] == 10
assert result["risk_level"] == "LOW"


print("All 5 aggregator tests passed!")
