import pytest
from app.core.registration import hash_reg_no, mask_reg_no, normalize_reg_no, validate_reg_no


def test_registration_normalization():
    """Verify that different casing and formats produce the same normalized string."""
    assert normalize_reg_no("tn 09 ab 1234") == "TN09AB1234"
    assert normalize_reg_no("TN-09-AB-1234") == "TN09AB1234"
    assert normalize_reg_no("TN09AB1234") == "TN09AB1234"
    assert normalize_reg_no("ka.01.mf.9999") == "KA01MF9999"


def test_registration_hashing_consistency():
    """Verify that equivalent registration inputs produce the exact same SHA-256 hash."""
    hash1 = hash_reg_no("tn 09 ab 1234")
    hash2 = hash_reg_no("TN09AB1234")
    hash3 = hash_reg_no("TN-09-AB-1234")

    assert hash1 == hash2 == hash3
    assert len(hash1) == 64


def test_registration_masking():
    """Verify that sensitive middle registration details are masked for privacy."""
    masked = mask_reg_no("TN09AB1234")
    assert "TN" in masked
    assert "1234" in masked
    assert "**" in masked


def test_registration_validation():
    """Verify validation of valid and invalid Indian state codes."""
    is_valid, _ = validate_reg_no("TN09AB1234")
    assert is_valid is True

    is_valid, _ = validate_reg_no("KA01MF9999")
    assert is_valid is True

    is_valid, _ = validate_reg_no("DL3CAA1111")
    assert is_valid is True

    # Invalid state code XX
    is_valid, _ = validate_reg_no("XX09AB1234")
    assert is_valid is False
