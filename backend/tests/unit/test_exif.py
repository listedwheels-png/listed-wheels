import io
import pytest
from PIL import Image
from app.services.media import strip_exif_and_optimize


def test_strip_exif_and_optimize():
    """Verify that EXIF stripping and optimization produces clean image bytes."""
    # Create sample in-memory image
    img = Image.new("RGB", (800, 600), color="navy")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    optimized = strip_exif_and_optimize(raw_bytes, max_width=500, quality=80)
    assert isinstance(optimized, bytes)
    assert len(optimized) > 0

    # Verify that the output image is readable and within dimensions
    with Image.open(io.BytesIO(optimized)) as processed_img:
        assert processed_img.width <= 500
        assert processed_img.format == "JPEG"
