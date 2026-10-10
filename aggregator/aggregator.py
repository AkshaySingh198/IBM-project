from aggregator import aggregate_results


def make_person3(kyc_match=False, anomaly=False):
    return {
        "entity_token": "PERSON_001",
        "kyc_agent": {
            "match_found": kyc_match,
            "verdict": "WATCHLIST MATCH" if kyc_match else "NO MATCH",
            "similarity_score": 100 if kyc_match else 0
        },
        "behavioral_agent": {
            "is_anomaly": anomaly,
            "verdict": "FLAGGED - unusual behavior" if anomaly else "NORMAL",
            "anomaly_score": -0.15 if anomaly else 0.1
        }
    }


# Test 1: No risk signals
result = aggregate_results(
    {
        "flag": False,
        "explanation": "No strong pattern match found"
    },
    {
        "entity_token": "PERSON_001",
        "ring_size": 0,
        "linked_tokens": []
    },
    make_person3()
)

print("Test 1:", result)

assert result["risk_score"] == 0
assert result["risk_level"] == "LOW"
assert result["entity_token"] == "PERSON_001"
assert len(result["evidence"]) == 1
assert result["human_review_required"] is False


# Test 2: All risk signals
result = aggregate_results(
    {
        "flag": True,
        "explanation": "Strong similarity with a past fraud case"
    },
    {
        "entity_token": "PERSON_001",
        "ring_size": 2,
        "linked_tokens": ["PERSON_004", "PERSON_007"]
    },
    make_person3(kyc_match=True, anomaly=True)
)

print("Test 2:", result)

assert result["risk_score"] == 100
assert result["risk_level"] == "HIGH"
assert result["signals"]["pattern_flag"] is True
assert result["signals"]["kyc_match"] is True
assert result["signals"]["behavioral_anomaly"] is True
assert len(result["evidence"]) == 4
assert len(result["signals"]["linked_tokens"]) == 2
assert result["human_review_required"] is True


# Test 3: Pattern signal only
result = aggregate_results(
    {"flag": True, "explanation": "Pattern detected"},
    {"entity_token": "PERSON_001", "ring_size": 0, "linked_tokens": []},
    make_person3()
)

print("Test 3:", result)
assert result["risk_score"] == 30
assert result["risk_level"] == "MEDIUM"
assert result["human_review_required"] is True


# Test 4: Behavioral anomaly only
result = aggregate_results(
    {"flag": False},
    {"entity_token": "PERSON_001", "ring_size": 0, "linked_tokens": []},
    make_person3(anomaly=True)
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
    make_person3()
)

print("Test 5:", result)
assert result["risk_score"] == 10
assert result["risk_level"] == "LOW"
assert result["signals"]["graph_ring_size"] == 2


print("All 5 aggregator tests passed!")
