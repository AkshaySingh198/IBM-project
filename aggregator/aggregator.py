
def aggregate_results(pattern_result, graph_result, person3_result):
    """Combine agent results into an explainable risk assessment."""

    pattern_flag = bool(pattern_result.get("flag", False))
    graph_ring = int(graph_result.get("ring_size", 0) or 0)

    kyc_result = person3_result.get("kyc_agent", {})
    behavioral_result = person3_result.get("behavioral_agent", {})

    kyc_match = bool(kyc_result.get("match_found", False))
    behavioral_anomaly = bool(
        behavioral_result.get("is_anomaly", False)
    )

    score, level = calculate_risk_score(
        pattern_flag, graph_ring, kyc_match, behavioral_anomaly
    )

    signals = {
        "pattern_flag": pattern_flag,
        "pattern_explanation": pattern_result.get(
            "explanation", "No strong pattern match found"
        ),
        "graph_ring_size": graph_ring,
        "linked_tokens": graph_result.get("linked_tokens", []),
        "kyc_match": kyc_match,
        "kyc_verdict": kyc_result.get("verdict", "Not provided"),
        "behavioral_anomaly": behavioral_anomaly,
        "behavioral_verdict": behavioral_result.get(
            "verdict", "Not provided"
        ),
    }

    evidence = []

    if pattern_flag:
        evidence.append({
            "source": "Pattern Agent",
            "finding": signals["pattern_explanation"],
        })

    if graph_ring > 0:
        evidence.append({
            "source": "Graph Agent",
            "finding": f"{graph_ring} linked entities detected",
            "linked_tokens": signals["linked_tokens"],
        })

    if kyc_match:
        evidence.append({
            "source": "KYC Agent",
            "finding": signals["kyc_verdict"],
        })

    if behavioral_anomaly:
        evidence.append({
            "source": "Behavioral Agent",
            "finding": signals["behavioral_verdict"],
        })

    if not evidence:
        evidence.append({
            "source": "Investigation",
            "finding": "No risk signals detected by current checks",
        })

    return {
        "entity_token": person3_result.get(
            "entity_token", graph_result.get("entity_token")
        ),
        "risk_score": score,
        "risk_level": level,
        "score_type": "Demo heuristic; not a validated fraud probability",
        "signals": signals,
        "evidence": evidence,
        "recommended_next_action": (
            "Prioritize human investigator review"
            if level == "HIGH"
            else "Review flagged evidence" if level == "MEDIUM"
            else "Continue normal monitoring"
        ),
        "human_review_required": level in ("HIGH", "MEDIUM"),
    }


def calculate_risk_score(
    pattern_flag, graph_ring_size, kyc_match, behavioral_anomaly
):
    """Demo scoring rule; this is not a validated probability."""

    score = 0
    score += 30 if pattern_flag else 0
    score += 30 if kyc_match else 0
    score += 30 if behavioral_anomaly else 0
    score += 10 if graph_ring_size > 0 else 0

    level = (
        "HIGH" if score >= 60
        else "MEDIUM" if score >= 30
        else "LOW"
    )

    return score, level
