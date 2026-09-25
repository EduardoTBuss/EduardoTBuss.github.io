#!/usr/bin/env python3
"""Generate a professional, minimalist OpenGraph image (1200x630) for eduardotbuss.github.io.

Design principles:
- Strict adherence to the site's aesthetic: dark minimalist palette, clean system typography.
- Zero personal photos (consistent with the architectural spec).
- 2x supersampling (2400x1260 -> 1200x630 via Lanczos) for crisp typography and clean lines.
- Outputs directly to public/og.png.
"""

from __future__ import annotations

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Canvas dimensions (standard OpenGraph is 1200x630)
OUTPUT_WIDTH = 1200
OUTPUT_HEIGHT = 630
SCALE = 2  # 2x supersampling

CANVAS_WIDTH = OUTPUT_WIDTH * SCALE
CANVAS_HEIGHT = OUTPUT_HEIGHT * SCALE

# Color Palette (Dark theme, aligned with site tokens & GitHub dark)
BG_COLOR = (9, 14, 22)            # #090e16 (site canvas)
CARD_BG = (16, 26, 39)            # #101a27 (site surface)
BORDER_COLOR = (48, 54, 61)       # #30363d (subtle border)
ACCENT_COLOR = (119, 217, 245)    # #77d9f5 (site accent token)
TEXT_PRIMARY = (240, 246, 252)    # #f0f6fc (off-white heading)
TEXT_MUTED = (139, 148, 158)      # #8b949e (muted description)
TEXT_DIM = (110, 118, 129)        # #6e7681 (subtle links/metadata)
DIVIDER_COLOR = (33, 38, 45)      # #21262d

def get_font(name: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    scaled_size = size * SCALE
    font_paths = {
        "bold": [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/System/Library/Fonts/SFProText-Bold.otf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
        "regular": [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/SFProText-Regular.otf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
        "mono": [
            "C:/Windows/Fonts/consola.ttf",
            "C:/Windows/Fonts/cour.ttf",
            "/System/Library/Fonts/SFMono-Regular.otf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        ],
    }

    candidates = font_paths.get(name, font_paths["regular"])
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, scaled_size)
            except Exception:
                continue
    return ImageFont.load_default()

def generate_og_image(output_path: Path) -> None:
    img = Image.new("RGB", (CANVAS_WIDTH, CANVAS_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    pad_x = 90 * SCALE
    pad_y = 80 * SCALE

    # 1. Subtle decorative container border (rounded rectangle)
    frame_left = 48 * SCALE
    frame_top = 48 * SCALE
    frame_right = CANVAS_WIDTH - frame_left
    frame_bottom = CANVAS_HEIGHT - frame_top
    draw.rounded_rectangle(
        [frame_left, frame_top, frame_right, frame_bottom],
        radius=16 * SCALE,
        fill=BG_COLOR,
        outline=BORDER_COLOR,
        width=2 * SCALE,
    )

    # 2. Top eyebrow: Domain / Portfolio label with subtle dot
    font_mono_small = get_font("mono", 14)
    dot_radius = 4 * SCALE
    dot_x = pad_x + dot_radius
    dot_y = pad_y + 9 * SCALE
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius],
        fill=ACCENT_COLOR,
    )
    eyebrow_text = "PORTFOLIO & RESEARCH"
    draw.text(
        (dot_x + 14 * SCALE, pad_y),
        eyebrow_text,
        font=font_mono_small,
        fill=ACCENT_COLOR,
    )

    # 3. Main Name Heading
    font_title = get_font("bold", 52)
    title_y = pad_y + 44 * SCALE
    draw.text(
        (pad_x, title_y),
        "Eduardo Timm Buss",
        font=font_title,
        fill=TEXT_PRIMARY,
    )

    # 4. Role & Affiliation
    font_subtitle = get_font("regular", 26)
    subtitle_y = title_y + 80 * SCALE
    draw.text(
        (pad_x, subtitle_y),
        "Computer Engineering @ UFPel",
        font=font_subtitle,
        fill=ACCENT_COLOR,
    )

    # 5. Core Research & Engineering Areas
    font_topics = get_font("regular", 21)
    topics_y = subtitle_y + 54 * SCALE
    topics_text = "Quantum Computing  \u00b7  Fuzzy Systems  \u00b7  Hardware Acceleration"
    draw.text(
        (pad_x, topics_y),
        topics_text,
        font=font_topics,
        fill=TEXT_MUTED,
    )

    # 6. Horizontal Divider
    divider_y = frame_bottom - 80 * SCALE
    draw.line(
        [(pad_x, divider_y), (frame_right - (pad_x - frame_left), divider_y)],
        fill=DIVIDER_COLOR,
        width=2 * SCALE,
    )

    # 7. Bottom bar: canonical site URL
    font_mono_footer = get_font("mono", 16)
    footer_text = "eduardotbuss.github.io"
    footer_y = divider_y + 26 * SCALE
    draw.text(
        (pad_x, footer_y),
        footer_text,
        font=font_mono_footer,
        fill=TEXT_MUTED,
    )

    # Status indicator badge on bottom right: "Static · Astro 6 · Zero JS"
    font_badge = get_font("mono", 13)
    badge_text = "Ideas. Experiments. Evidence."
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = bbox[2] - bbox[0]
    badge_x = frame_right - (pad_x - frame_left) - badge_w
    draw.text(
        (badge_x, footer_y + 3 * SCALE),
        badge_text,
        font=font_badge,
        fill=TEXT_DIM,
    )

    # 8. Downsample to target 1200x630 using Lanczos antialiasing
    final_img = img.resize((OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    final_img.save(output_path, format="PNG", optimize=True)
    print(f"Generated {output_path} ({OUTPUT_WIDTH}x{OUTPUT_HEIGHT}, {output_path.stat().st_size} bytes)")

if __name__ == "__main__":
    import sys
    root_dir = Path(__file__).resolve().parent.parent
    target = root_dir / "public" / "og.png"
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    generate_og_image(target)
