import json
from pathlib import Path
from typing import Any, Dict, Optional

_LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"
_TRANSLATIONS: Dict[str, Dict[str, Any]] = {}


def load_translations(lang: str = "en") -> Dict[str, Any]:
    """Loads JSON translation file for the given language code."""
    if lang in _TRANSLATIONS:
        return _TRANSLATIONS[lang]
    
    file_path = _LOCALES_DIR / f"{lang}.json"
    if not file_path.exists():
        # Fallback to English
        file_path = _LOCALES_DIR / "en.json"
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _TRANSLATIONS[lang] = data
            return data
    except Exception:
        return {}


def t(key_path: str, lang: str = "en", **kwargs: Any) -> str:
    """Retrieves a translated string using dot notation (e.g. 'errors.PLAN_NOT_FOUND')."""
    translations = load_translations(lang)
    parts = key_path.split(".")
    curr = translations
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return key_path  # Fallback to key path if missing
    
    if isinstance(curr, str):
        if kwargs:
            return curr.format(**kwargs)
        return curr
    
    return str(curr)
