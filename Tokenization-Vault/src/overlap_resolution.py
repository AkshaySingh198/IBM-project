"""
overlap_resolution.py

Presidio can run multiple recognizers at once (built-in PERSON detector,
your custom ACCOUNT_NUMBER regex, etc.), and sometimes two of them claim
overlapping stretches of the same text .

This function takes Presidio's raw list of matches and picks ONE winner
per overlapping region: highest confidence score first, and if scores tie,
the longer match wins (a longer match is usually the more complete one).

It basically decides which PII detection to keep when two detections overlap.
"""

from typing import Protocol


class Match(Protocol):
    start: int
    end: int
    score: float
    entity_type: str


def resolve_overlaps(matches: list[Match]) -> list[Match]:
    
    candidates = sorted(matches, key=lambda m: (-m.score, -(m.end - m.start)))

    accepted: list[Match] = []
    for candidate in candidates:
        overlaps_existing = any(
            candidate.start < existing.end and candidate.end > existing.start
            for existing in accepted
        )
        if not overlaps_existing:
            accepted.append(candidate)

    return accepted
