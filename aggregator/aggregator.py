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

    risk_result = calculate_risk_score(
        pattern_flag,
        graph_ring,
        kyc_match,
        behavioral_anomaly
    )

    return {
        "pattern_flag": pattern_flag,
        "graph_ring_size": graph_ring,
        "kyc_match": kyc_match,
        "behavioral_anomaly": behavioral_anomaly,
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"]
    }


def calculate_risk_score(
    pattern_flag,
    graph_ring_size,
    kyc_match,
    behavioral_anomaly
):
    """
    Calculates a 0-100 risk score from four investigation signals.
    """

    score = 0

    if pattern_flag:
        score += 30

    if kyc_match:
        score += 30

    if behavioral_anomaly:
        score += 30

    if graph_ring_size > 0:
        score += 10

    if score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_score": score,
        "risk_level": level
    }
