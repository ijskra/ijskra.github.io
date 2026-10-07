"""Regenerate responsive portraits from the original PNG (requires Pillow)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
original = Image.open(root / 'assets/photo-lines-cut.png').convert('RGBA')
for width in (350, 700):
    resized = original if width == original.width else original.resize(
        (width, round(original.height * width / original.width)), Image.Resampling.LANCZOS
    )
    output = root / f'assets/portrait-{width}.webp'
    resized.save(output, lossless=True, method=6, exact=True)
    assert resized.tobytes() == Image.open(output).convert('RGBA').tobytes()
    print(f'{output.name}: {output.stat().st_size:,} bytes; exact RGBA pixels preserved')
