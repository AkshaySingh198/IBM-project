"""
Finds PII in normal text and replaces it with tokens.

NOTE: This file needs Presidio + a spaCy model installed:
    pip install presidio-analyzer presidio-anonymizer
    python -m spacy download en_core_web_lg

"""

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer

from overlap_resolution import resolve_overlaps
from vault import Vault

_ACCOUNT_NUMBER_PATTERN = Pattern(name="account_pattern", regex=r"\b\d{9,12}\b", score=0.9)
_ACCOUNT_RECOGNIZER = PatternRecognizer(
    supported_entity="ACCOUNT_NUMBER", patterns=[_ACCOUNT_NUMBER_PATTERN]
)

_ENTITIES_TO_DETECT = ["PERSON", "ACCOUNT_NUMBER", "LOCATION"]


def _build_analyzer() -> AnalyzerEngine:
    analyzer = AnalyzerEngine()
    analyzer.registry.add_recognizer(_ACCOUNT_RECOGNIZER)
    return analyzer


def tokenize_text(text: str, analyzer: AnalyzerEngine, vault: Vault) -> str:
    """
    Scans `text` for PII and returns a new string with every match replaced
    by a consistent token from the shared vault.

    Token NUMBERING is assigned in reading order (left-to-right through
    the text), independent of the order the actual string replacement
    happens in.
    """
    raw_matches = analyzer.analyze(text=text, language="en", entities=_ENTITIES_TO_DETECT)
    accepted_matches = resolve_overlaps(raw_matches)

    token_by_match_id = {}
    for match in sorted(accepted_matches, key=lambda m: m.start):
        real_value = text[match.start:match.end]
        token_by_match_id[id(match)] = vault.get_token(match.entity_type, real_value)

    for match in sorted(accepted_matches, key=lambda m: m.start, reverse=True):
        token = token_by_match_id[id(match)]
        text = text[:match.start] + token + text[match.end:]

    return text

if __name__ == "__main__":
    analyzer = _build_analyzer()

    import vault as vault_module
    vault_module.DB_PATH = "sanity_check_vault.db"
    vault_module.KEY_PATH = "sanity_check_key.key"

    vault = Vault()

    sample = "Rahul Sharma sent money to Priya Singh from account 1234567890 in Mumbai."
    print(tokenize_text(sample, analyzer, vault))

    vault.close()