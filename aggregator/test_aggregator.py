from aggregator import aggregate_results


def run_test_no_risk_signals():
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

    result = aggregate_results(
        pattern_result, graph_result, person3_result
    )

    assert result["risk_score"] == 0
    assert result["risk_level"] == "LOW"
    assert result["entity_token"] == "PERSON_001"
    assert result["signals"]["pattern_flag"] is False
    assert result["signals"]["kyc_match"] is False
    assert result["signals"]["behavioral_anomaly"] is False
    assert len(result["evidence"]) == 1
    assert result["human_review_required"] is False

    print("Test 1 passed: No risk signals")


def run_test_all_risk_signals():
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

    result = aggregate_results(
        pattern_result, graph_result, person3_result
    )

    assert result["risk_score"] == 100
    assert result["risk_level"] == "HIGH"
    assert result["entity_token"] == "PERSON_001"
    assert result["signals"]["pattern_flag"] is True
    assert result["signals"]["kyc_match"] is True
    assert result["signals"]["behavioral_anomaly"] is True
    assert result["signals"]["graph_ring_size"] == 2
    assert len(result["signals"]["linked_tokens"]) == 2
    assert len(result["evidence"]) == 4
    assert result["human_review_required"] is True
    assert (
        result["recommended_next_action"]
        == "Prioritize human investigator review"
    )

    print("Test 2 passed: All risk signals")


def run_test_pattern_signal_only():
    pattern_result = {
        "flag": True,
        "explanation": "Suspicious transaction pattern"
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

    result = aggregate_results(
        pattern_result, graph_result, person3_result
    )

    assert result["risk_score"] == 30
    assert result["risk_level"] == "MEDIUM"
    assert result["signals"]["pattern_flag"] is True
    assert result["signals"]["kyc_match"] is False
    assert result["signals"]["behavioral_anomaly"] is False
    assert result["human_review_required"] is True

    print("Test 3 passed: Pattern signal only")


if __name__ == "__main__":
    run_test_no_risk_signals()
    run_test_all_risk_signals()
    run_test_pattern_signal_only()

    print("All aggregator tests passed!")
