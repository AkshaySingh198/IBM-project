"""
structured_tokenizer.py

Finds and replaces PII in CSV/table data.

Change the marked line to change the input CSV(read the comments to find the line .)
"""

import pandas as pd
from vault import Vault


# Column name -> entity type, for columns that are a single self-contained
# piece of PII (most columns).
SIMPLE_PII_COLUMNS = {
    "PersonalPhone": "PHONE_NUMBER",
    "PersonalEmail": "EMAIL",
    "PersonalAddress": "ADDRESS",
    "BankAccountNumber": "ACCOUNT_NUMBER",
    "EmergencyContactName": "PERSON",
    "EmergencyContactPhone": "PHONE_NUMBER",
    "Supervisor": "PERSON",
    "ADEmail": "EMAIL",
    "IPAddress": "IP_ADDRESS",   
    "DeviceID": "DEVICE_ID",     
}

# Columns that together identify ONE person and should become ONE token,
# not two separate ones.
FULL_NAME_COLUMNS = ("FirstName", "LastName")


def tokenize_dataframe(df: pd.DataFrame, vault: Vault) -> pd.DataFrame:
    """
    Returns a NEW dataframe with PII columns replaced by tokens.
    Does not modify the original dataframe.
    """
    result = df.copy()

    first_col, last_col = FULL_NAME_COLUMNS
    if first_col in result.columns and last_col in result.columns:
        def tokenize_row_name(row):
            full_name = f"{row[first_col]} {row[last_col]}".strip()
            return vault.get_token("PERSON", full_name)

        result[first_col] = result.apply(tokenize_row_name, axis=1)
        result[last_col] = ""  

    for column, entity_type in SIMPLE_PII_COLUMNS.items():
        if column in result.columns:
            result[column] = result[column].apply(
                lambda value: vault.get_token(entity_type, str(value))
            )

    return result


if __name__ == "__main__":
    INPUT_CSV = "privacy_preserving_employee_dataset_with_planted_links.csv"  # change this line to switch input files

    vault = Vault()
    df = pd.read_csv(INPUT_CSV)
    tokenized = tokenize_dataframe(df, vault)
    tokenized.to_csv("tokenized_employee_dataset.csv", index=False)
    print(f"Done — {len(tokenized)} rows tokenized from {INPUT_CSV}. Check tokenized_employee_dataset.csv")
    vault.close()