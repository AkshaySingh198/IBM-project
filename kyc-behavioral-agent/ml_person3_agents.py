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

Dependencies: pandas, scikit-learn, rapidfuzz
    pip install pandas scikit-learn rapidfuzz
"""

import pandas as pd
from sklearn.ensemble import IsolationForest
from rapidfuzz import fuzz

# ----------------------------------------------------------------------
# CONFIG — adjust paths / values as needed
# ----------------------------------------------------------------------
DATA_PATH = "creditcard.csv"          # training data used to fit the Behavioral Agent
CONTAMINATION = 0.003                 # tuned value — see notebook for sweep results
KYC_MATCH_THRESHOLD = 90              # fuzzy match % required to flag a watchlist hit

# Mock watchlist — replace with real tokenized watchlist from the vault team (ML Person 1)
WATCHLIST = ["PERSON_0042", "PERSON_0198", "PERSON_0753", "PERSON_1200"]


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
# KYC / SANCTIONS AGENT
# ----------------------------------------------------------------------
def kyc_check(entity_token, watchlist=WATCHLIST, threshold=KYC_MATCH_THRESHOLD):
    """Fuzzy-matches a tokenized entity against the watchlist."""
    best_match = None
    best_score = 0

    for entry in watchlist:
        score = fuzz.ratio(entity_token, entry)
        if score > best_score:
            best_score = score
            best_match = entry

    is_match = best_score >= threshold

    return {
        "match_found": is_match,
        "matched_entity": best_match if is_match else None,
        "similarity_score": best_score,
        "verdict": f"WATCHLIST MATCH - {best_match}" if is_match else "NO MATCH"
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
    result = investigate_transaction("PERSON_0042", test_row)
    print("Sample fraud case result:")
    print(result)
