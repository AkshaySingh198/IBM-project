# Person 3: Real KYC + Behavioral Agent
import os
import sys
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERSON3_DIR = os.path.join(BASE_DIR, "kyc-behavioral-agent")
sys.path.insert(0, PERSON3_DIR)

from ml_person3_agents import investigate_transaction, FEATURES

sample_transaction = {
    "Amount": 50000,
    "FailedLoginAttempts": 5,
    "FilesAccessed": 30,
    "SessionDuration": 180,
    "AfterHoursAccess": 1,
    "ExternalDevice": 1
}

person3_result = investigate_transaction(
    case["sender"],
    sample_transaction
)

print("\nPERSON 3 RESULT:")
print(person3_result)
