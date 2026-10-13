"""
ML Person 3 — KYC/Sanctions Agent + Behavioral Agent
IBM Z Datathon — Zero-Exposure Fraud Investigation Copilot

This module exposes ONE function for the Aggregator to call per case:

    investigate_transaction(entity_token, transaction_row)

Input:
    entity_token     : str  — tokenized entity ID (e.g. "PERSON_0042")
    transaction_row  : pandas DataFrame with ONE row, same feature columns
                        used in training (Time, V1-V28, Amount — NOT 'Class')

Output: nested dict —
    {
        "entity_token": str,
        "kyc_agent": {
            "match_found": bool,
            "matched_entity": str or None,
            "similarity_score": float,
            "verdict": str
        },
        "behavioral_agent": {
            "is_anomaly": bool,
            "anomaly_score": float,
            "verdict": str
        }
    }

Dependencies: pandas, scikit-learn
    pip install pandas scikit-learn

Required data files (same folder as this script, or update paths below):
    creditcard.csv               — training data for Behavioral Agent
    token_watchlist_linkage.json — real watchlist from ML Person 1 (token -> True/False)
"""

import json
import pandas as pd
from sklearn.ensemble import IsolationForest

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------
DATA_PATH = "creditcard.csv"
WATCHLIST_PATH = "token_watchlist_linkage.json"   # from ML Person 1 (vault/tokenization team)
CONTAMINATION = 0.003                             # tuned value — see notebook for sweep results


# ----------------------------------------------------------------------
# BEHAVIORAL AGENT — trained once at import time
# ----------------------------------------------------------------------
_df = pd.read_csv(DATA_PATH)
_features = _df.drop(columns=["Class"])

behavioral_model = IsolationForest(
    n_estimators=100,
    contamination=CONTAMINATION,
    random_state=42
)
behavioral_model.fit(_features)


def score_transaction(transaction_row, model=behavioral_model):
    """Scores a single transaction for behavioral anomaly."""
    pred = model.predict(transaction_row)[0]
    raw_score = model.decision_function(transaction_row)[0]  # lower = more anomalous
    is_anomaly = (pred == -1)

    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": round(float(raw_score), 4),
        "verdict": "FLAGGED - unusual transaction pattern" if is_anomaly else "NORMAL"
    }


# ----------------------------------------------------------------------
# KYC / SANCTIONS AGENT — real watchlist from ML Person 1
# ----------------------------------------------------------------------
with open(WATCHLIST_PATH, "r") as _f:
    WATCHLIST_LOOKUP = json.load(_f)


def kyc_check(entity_token, watchlist=WATCHLIST_LOOKUP):
    """
    Direct lookup against ML Person 1's token-watchlist linkage.
    Returns match status based on the exact token's flag (True/False).
    Unknown tokens (not in the linkage file) default to no match.
    """
    is_match = watchlist.get(entity_token, False)

    return {
        "match_found": is_match,
        "matched_entity": entity_token if is_match else None,
        "similarity_score": 100.0 if is_match else 0.0,  # kept for Aggregator interface consistency
        "verdict": f"WATCHLIST MATCH - {entity_token}" if is_match else "NO MATCH"
    }


# ----------------------------------------------------------------------
# COMBINED ENTRY POINT — this is what the Aggregator (ML Person 4) calls
# ----------------------------------------------------------------------
def investigate_transaction(entity_token, transaction_row):
    """
    Single entry point for the Aggregator.
    Runs both KYC/Sanctions and Behavioral checks on one case.
    """
    kyc_result = kyc_check(entity_token)
    behavioral_result = score_transaction(transaction_row)

    return {
        "entity_token": entity_token,
        "kyc_agent": kyc_result,
        "behavioral_agent": behavioral_result
    }


# ----------------------------------------------------------------------
# Quick self-test when run directly (not on import)
# ----------------------------------------------------------------------
if __name__ == "__main__":
    fraud_index = _df[_df["Class"] == 1].index[0]
    test_row = _features.loc[[fraud_index]]
    result = investigate_transaction("PERSON_011", test_row)
    print("Sample fraud case result:")
    print(result)
