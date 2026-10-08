import hashlib
import re
from typing import Optional, Tuple
from app.core.errors import BadRequestError

INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CT", "CG", "DL", "DN", "DD", "GA",
    "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN",
    "MP", "MZ", "NL", "OD", "OR", "PB", "PY", "RJ", "SK", "TN", "TR", "TS",
    "TG", "UK", "UA", "UP", "UT", "WB", "BH"
}


def normalize_reg_no(reg_no: str) -> str:
    """
    Normalizes Indian vehicle registration numbers.
    Removes spaces, dashes, dots, and converts to uppercase.
    e.g. 'tn 09 ab 1234', 'TN-09-AB-1234', 'TN09AB1234' -> 'TN09AB1234'
    """
    if not reg_no:
        return ""
    clean = re.sub(r"[\s\-\.]+", "", reg_no).upper()
    return clean


def validate_reg_no(reg_no: str) -> Tuple[bool, str]:
    """
    Validates Indian vehicle registration format and state prefix.
    Returns (is_valid, normalized_string).
    """
    clean = normalize_reg_no(reg_no)
    if not clean:
        return False, ""

    # Standard format: State code (2) + District/RTO code (1-3) + Optional Series (0-3) + Unique Digits (1-4)
    # or Bharat series (BH): YY BH #### XX
    pattern = r"^[A-Z]{2}[0-9]{1,3}[A-Z]{0,3}[0-9]{1,4}$"
    if not re.match(pattern, clean):
        return False, clean

    state_code = clean[:2]
    if state_code not in INDIAN_STATE_CODES:
        return False, clean

    return True, clean


def hash_reg_no(reg_no: str) -> str:
    """Computes SHA-256 hash of normalized registration number for duplicate checks and ban lists."""
    clean = normalize_reg_no(reg_no)
    if not clean:
        return ""
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()


def mask_reg_no(reg_no: str) -> str:
    """
    Masks the middle portion of the registration number to protect owner privacy from scrapers.
    e.g. 'TN09AB1234' -> 'TN 09 ** 1234'
    """
    clean = normalize_reg_no(reg_no)
    if len(clean) < 6:
        return clean

    state = clean[:2]
    rto = clean[2:4] if clean[2:4].isdigit() else clean[2:3]
    digits = clean[-4:] if clean[-4:].isdigit() else clean[-2:]

    return f"{state} {rto} ** {digits}"
