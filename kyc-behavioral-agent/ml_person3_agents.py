
import os
import pandas as pd
from sklearn.ensemble import IsolationForest
from rapidfuzz import fuzz

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "behavioral_training_data.csv")

CONTAMINATION = 0.03
KYC_MATCH_THRESHOLD = 90

# Temporary watchlist; later connect Person 1's tokenized watchlist.
WATCHLIST = [
    "PERSON_0042",
    "PERSON_0198",
    "PERSON_0753",
    "PERSON_1200"
]

FEATURES = [
    "Amount",
    "FailedLoginAttempts",
    "FilesAccessed",
    "SessionDuration",
    "AfterHoursAccess",
    "ExternalDevice"
]

_df = pd.read_csv(DATA_PATH)
_features = _df[FEATURES].copy()

behavioral_model = IsolationForest(
    n_estimators=100,
    contamination=CONTAMINATION,
    random_state=42
)
behavioral_model.fit(_features)


def score_transaction(transaction_row, model=behavioral_model):
    if isinstance(transaction_row, dict):
        row = pd.DataFrame([transaction_row])
    elif isinstance(transaction_row, pd.DataFrame):
        row = transaction_row.copy()
    else:
        raise TypeError("transaction_row must be a dict or DataFrame")

    missing = [col for col in FEATURES if col not in row.columns]
    if missing:
        raise ValueError(f"Missing behavioral features: {missing}")

    row = row[FEATURES].apply(pd.to_numeric, errors="raise")
    pred = model.predict(row)[0]
    raw_score = model.decision_function(row)[0]
    is_anomaly = pred == -1

    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": round(float(raw_score), 4),
        "verdict": (
            "FLAGGED - unusual transaction pattern"
            if is_anomaly else "NORMAL"
        )
    }


def kyc_check(entity_token, watchlist=None, threshold=KYC_MATCH_THRESHOLD):
    if watchlist is None:
        watchlist = WATCHLIST

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


def investigate_transaction(entity_token, transaction_row):
    return {
        "entity_token": entity_token,
        "kyc_agent": kyc_check(entity_token),
        "behavioral_agent": score_transaction(transaction_row)
    }


if __name__ == "__main__":
    sample = _features.iloc[[0]]
    print(investigate_transaction("PERSON_0042", sample))
