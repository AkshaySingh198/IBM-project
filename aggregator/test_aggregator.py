from aggregator import aggregate_results


# Test 1: No risk signals
pattern_result = {
    "flag": False
}

graph_result = {
    "ring_size": 0
}

person3_result = {
    "kyc_agent": {
        "match_found": False
    },
    "behavioral_agent": {
        "is_anomaly": False
    }
}

result = aggregate_results(
    pattern_result,
    graph_result,
    person3_result
)

print("Test 1:", result)


# Test 2: All risk signals
pattern_result = {
    "flag": True
}

graph_result = {
    "ring_size": 2
}

person3_result = {
    "kyc_agent": {
        "match_found": True
    },
    "behavioral_agent": {
        "is_anomaly": True
    }
}

result = aggregate_results(
    pattern_result,
    graph_result,
    person3_result
)

print("Test 2:", result)
