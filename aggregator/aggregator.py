def aggregate_results(pattern_result, graph_result, person3_result):
    """Combine investigation signals into an explainable risk report."""

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
        evidence.append({
            "source": "Pattern Agent",
            "finding": pattern_result.get(
                "explanation", "Similar past case detected"
            )
        })

    if graph_ring > 0:
        evidence.append({
            "source": "Graph Agent",
            "finding": f"{graph_ring} linked entities found",
            "linked_tokens": graph_result.get("linked_tokens", [])
        })

    if kyc_match:
        evidence.append({
            "source": "KYC/Sanctions Agent",
            "finding": kyc_result.get(
                "verdict", "Watchlist match detected"
            ),
            "similarity_score": kyc_result.get("similarity_score")
        })

    if behavioral_anomaly:
        evidence.append({
            "source": "Behavioral Agent",
            "finding": behavioral_result.get(
                "verdict", "Unusual behavior detected"
            ),
            "anomaly_score": behavioral_result.get("anomaly_score")
        })

    if not evidence:
        evidence.append({
            "source": "Investigation",
            "finding": "No risk signals detected by the current checks"
        })

    if risk_result["risk_level"] == "HIGH":
        next_action = "Prioritize human investigator review"
    elif risk_result["risk_level"] == "MEDIUM":
        next_action = "Review flagged evidence before deciding"
    else:
        next_action = "No current alert; follow normal monitoring procedures"

    return {
        "entity_token": person3_result.get(
            "entity_token", graph_result.get("entity_token")
        ),
        "risk_score": risk_result["risk_score"],
        "risk_level": risk_result["risk_level"],
        "score_type": "Demo heuristic; not a validated fraud probability",
        "signals": {
            "pattern_flag": pattern_flag,
            "pattern_explanation": pattern_result.get("explanation"),
            "graph_ring_size": graph_ring,
            "linked_tokens": graph_result.get("linked_tokens", []),
            "kyc_match": kyc_match,
            "kyc_verdict": kyc_result.get("verdict"),
            "behavioral_anomaly": behavioral_anomaly,
            "behavioral_verdict": behavioral_result.get("verdict")
        },
        "evidence": evidence,
        "recommended_next_action": next_action,
        "human_review_required": risk_result["risk_level"] in ("MEDIUM", "HIGH")
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
