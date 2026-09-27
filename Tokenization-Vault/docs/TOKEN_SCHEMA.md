# Token Schema

This module replaces sensitive information with simple tokens before the data is passed to other agents.

For example:

`Rahul Sharma` → `PERSON_001`
`9876543210` → `ACCOUNT_NUMBER_001`
`Patna` → `LOCATION_001`

The actual values stay inside the encrypted vault. Downstream agents only see the tokens.

## How tokens work

A token follows this format:

`<ENTITY_TYPE>_<3-digit number>`

Some examples:

* `PERSON_001`
* `ACCOUNT_NUMBER_014`
* `EMAIL_007`
* `PHONE_NUMBER_002`
* `IP_ADDRESS_001`
* `DEVICE_ID_001`

The same real value always gets the same token, even when it appears in different files or is processed through different tokenization methods.

## What can be tokenized?

| Type           | Example                                       |
| -------------- | --------------------------------------------- |
| PERSON         | Rahul Sharma                                  |
| ACCOUNT_NUMBER | 9876543210                                    |
| EMAIL          | [rahul@example.com](mailto:rahul@example.com) |
| PHONE_NUMBER   | +91-9876543210                                |
| LOCATION       | Patna                                         |
| ADDRESS        | 12 Fraser Road, Patna                         |
| IP_ADDRESS     | 192.168.1.10                                  |
| DEVICE_ID      | DEV-A82F31                                    |

## Why this matters

The other agents can still find relationships between records without seeing someone's actual identity.

For example:

`PERSON_001 → ACCOUNT_NUMBER_001 → DEVICE_ID_003`

can be used for pattern and fraud analysis without exposing the person's name or other raw PII.

## A few implementation details

* Free-form text uses Presidio and custom detection rules.
* Structured CSV data uses the same vault, so tokens stay consistent across datasets.
* Overlapping detections are resolved before tokens are created.
* Real values are encrypted and stored only in the local vault.
* `PHONE_NUMBER` detection is handled mainly through structured data to avoid confusing transaction amounts with phone numbers.
* DOB is currently not tokenized.

## Files used by other agents

The main outputs are:

* `tokenized_dataset.json` — tokenized transaction text
* `tokenized_employee_dataset.csv` — tokenized structured data
* `token_watchlist_linkage.json` — tells downstream agents whether a token is on the watchlist

