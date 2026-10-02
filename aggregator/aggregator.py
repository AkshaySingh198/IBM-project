def aggregate_results(pattern_result, graph_result, person3_result):
    """
    Combines outputs from Pattern, Graph, KYC and Behavioral agents.
    """

    pattern_flag = pattern_result.get("flag", False)
    graph_ring = graph_result.get("ring_size", 0)

    kyc_result = person3_result.get("kyc_agent", {})
    behavioral_result = person3_result.get("behavioral_agent", {})

    kyc_match = kyc_result.get("match_found", False)
    behavioral_anomaly = behavioral_result.get("is_anomaly", False)

    return {
        "pattern_flag": pattern_flag,
        "graph_ring_size": graph_ring,
        "kyc_match": kyc_match,
        "behavioral_anomaly": behavioral_anomaly
    }
