import pytest
from app.core.i18n import t, load_translations


def test_i18n_loading_and_keys():
    """Verify that translation keys resolve accurately."""
    msg = t("errors.PLAN_NOT_FOUND", category="cars")
    assert "cars" in msg
    assert "Listing plan for category 'cars' was not found" in msg


def test_i18n_fallback():
    """Verify that unknown keys fallback gracefully."""
    msg = t("non_existent_key.path")
    assert msg == "non_existent_key.path"
