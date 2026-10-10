
def aggregate_results(pattern_result, graph_result, person3_result):
    """Combine investigation signals into an explainable risk result."""

    pattern_flag = pattern_result.get("flag", False)
    graph_ring = graph_result.get("ring_size", 0) or 0

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

    evidence = []

    if pattern_flag:
        evidence.append(
            pattern_result.get("explanation", "Similar past case detected")
        )

    if graph_ring > 0:
        evidence.append(
            f"Graph analysis found {graph_ring} linked entities"
        )

    if kyc_match:
        evidence.append(
            kyc_result.get("verdict", "Watchlist match detected")
        )

    if behavioral_anomaly:
        evidence.append(
            behavioral_result.get(
                "verdict", "Unusual behavior detected"
            )
        )

    if not evidence:
        evidence.append("No risk signals detected by the current checks")

    return {
        "entity_token": person3_result.get(
            "entity_token", graph_result.get("entity_token")
        ),
        "pattern_flag": pattern_flag,
        "pattern_explanation": pattern_result.get("explanation"),
        "graph_ring_size": graph_ring,
        "linked_tokens": graph_result.get("linked_tokens", []),
        "kyc_match": kyc_match,
        "kyc_verdict": kyc_result.get("verdict"),
        "behavioral_anomaly": behavioral_anomaly,
        "behavioral_verdict": behavioral_result.get("verdict"),
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"],
        "evidence": evidence
    }


def calculate_risk_score(
    pattern_flag,
    graph_ring_size,
    kyc_match,
    behavioral_anomaly
):
    """Demo heuristic score, not a validated fraud probability."""

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

    return {"risk_score": score, "risk_level": level}
