"""
AI Worker — local OCR + layout extraction service for the AI Resume Builder.

Runs as a separate process (Docker or `uvicorn main:app --port 8000`).
The Next.js app calls it via HTTP when AI_WORKER_URL is set; if the worker is
unreachable or unhealthy the TS side falls back to premium APIs.

Endpoints:
  GET  /health                — { "ok": true } when ready
  POST /extract/ocr           — multipart 'file' → { rawText, confidence }
  POST /extract/layout        — multipart 'file' → {
                                  shell, regions, header, section,
                                  uppercase, sidebarWidthPct, sidebarBg,
                                  confidence }

Phase 5: OCR via Tesseract, layout stub.
Phase 6: Full OpenCV layout detection — shell, header style, section style,
         sidebar width/background, uppercase detection via Tesseract sampling.

The worker returns ONLY structured data. No HTML, no UI generation, no
business logic. The Next.js side owns rendering and orchestration.
"""

from __future__ import annotations

import io
import logging
import os
from typing import Optional

import cv2
import numpy as np
import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel

try:
    from markitdown import MarkItDown

    _markitdown: Optional["MarkItDown"] = MarkItDown(enable_plugins=False)
except Exception:  # noqa: BLE001 — keep the worker usable even if markitdown is absent
    _markitdown = None

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger("ai-worker")

app = FastAPI(title="AI Resume Builder — Local Worker", version="0.2.0")


# ── Pydantic models ──────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    ok: bool
    tesseract_version: Optional[str] = None
    markitdown: bool = False


class ConvertResponse(BaseModel):
    markdown: str
    chars: int


class OcrResponse(BaseModel):
    rawText: str
    confidence: float


class LayoutResponse(BaseModel):
    shell: str
    regions: dict[str, list[str]]
    # Phase 6 additions — all Optional so callers that haven't updated yet still work
    header: Optional[str] = None
    section: Optional[str] = None
    uppercase: Optional[bool] = None
    sidebarWidthPct: Optional[int] = None
    sidebarBg: Optional[str] = None
    confidence: float


# ── Image helpers ────────────────────────────────────────────────────────────


def _load_pil(payload: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(payload)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=415, detail=f"Unsupported image: {exc}") from exc


def _to_cv(img_pil: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.asarray(img_pil), cv2.COLOR_RGB2BGR)


def _confidence_from_tesseract(data: dict) -> float:
    raw = data.get("conf", [])
    nums = [int(v) for v in raw if isinstance(v, (int, str)) and str(v).lstrip("-").isdigit() and int(v) >= 0]
    if not nums:
        return 0.0
    return round(sum(nums) / len(nums) / 100.0, 3)


# ── Shell detection ──────────────────────────────────────────────────────────


def _detect_shell(
    img_rgb: np.ndarray,
    h: int,
    w: int,
) -> tuple[str, int | None, float]:
    """
    Detect layout shell and sidebar width.
    Returns (shell, sidebarWidthPct | None, confidence).

    Strategy:
      1. Check whether the left or right ~15-40 % of the image has a
         consistently different background colour from the body — this is
         the definitive sidebar signal.
      2. Check for a two-column gutter (low text density in the middle band).
      3. Default to single.
    """
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    # --- Sidebar detection via background-colour variance scan ---
    # Scan strips from each edge inward; find the largest strip whose
    # average brightness differs significantly from the rest.
    def _edge_strip_brightness(side: str, pct: int) -> float:
        px = max(1, int(w * pct / 100))
        strip = gray[:, :px] if side == "left" else gray[:, w - px :]
        return float(strip.mean())

    body_brightness = float(gray[:, int(w * 0.35) : int(w * 0.65)].mean())

    left_brightness = _edge_strip_brightness("left", 30)
    right_brightness = _edge_strip_brightness("right", 30)

    left_diff = abs(left_brightness - body_brightness)
    right_diff = abs(right_brightness - body_brightness)

    # Threshold: at least 25 brightness units difference signals a sidebar
    SIDEBAR_THRESHOLD = 25

    if left_diff > SIDEBAR_THRESHOLD and left_diff > right_diff:
        width_pct = _estimate_sidebar_boundary(gray, h, w, "left")
        return "sidebar-left", width_pct, 0.80

    if right_diff > SIDEBAR_THRESHOLD and right_diff > left_diff:
        width_pct = _estimate_sidebar_boundary(gray, h, w, "right")
        return "sidebar-right", width_pct, 0.80

    # --- Two-column detection via gutter ---
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    col_density = thresh.sum(axis=0).astype(float)
    col_max = col_density.max() or 1.0
    col_norm = col_density / col_max

    mid_start, mid_end = w // 3, 2 * w // 3
    mid_band = col_norm[mid_start:mid_end]
    gutter_ratio = float(mid_band.min()) if len(mid_band) else 1.0

    if gutter_ratio < 0.12:
        return "two-column", None, 0.65

    return "single", None, 0.70


def _estimate_sidebar_boundary(gray: np.ndarray, h: int, w: int, side: str) -> int:
    """
    Walk inward along the middle row to find the brightness jump that marks
    the edge between the sidebar and the main body.
    Returns width as a percentage of w, clamped to [15, 45].
    """
    mid_row = gray[h // 2, :].astype(float)
    if side == "left":
        for x in range(int(w * 0.10), int(w * 0.55)):
            if mid_row[x] - mid_row[x - 1] > 20:
                return max(15, min(45, round(x / w * 100)))
        return 30
    else:
        for x in range(int(w * 0.45), int(w * 0.90)):
            if mid_row[x] - mid_row[x - 1] < -20:
                return max(15, min(45, round((w - x) / w * 100)))
        return 30


# ── Header style detection ───────────────────────────────────────────────────


def _detect_header_style(img_rgb: np.ndarray, h: int, w: int) -> tuple[str, float]:
    """
    Examine the top ~18 % of the image to classify header style.

    Priority order:
      banner-dark   → very dark bg (avg brightness < 75)
      banner-accent → saturated coloured bg
      two-tone      → two clearly different horizontal bands
      line-accent   → short coloured bar in the top strip
      split         → text on both far left and far right with a centre gap
      stack-center  → text centroid near horizontal centre
      underbar      → strong horizontal edge at the header/body boundary
      stack-left    → fallback
    """
    header_h = max(4, int(h * 0.18))
    header_bgr = img_rgb[:header_h, :]

    header_gray = cv2.cvtColor(header_bgr, cv2.COLOR_BGR2GRAY)
    header_hsv = cv2.cvtColor(header_bgr, cv2.COLOR_BGR2HSV)

    avg_brightness = float(header_gray.mean())
    avg_saturation = float(header_hsv[:, :, 1].mean())

    # banner-dark
    if avg_brightness < 75:
        return "banner-dark", 0.85

    # banner-accent / two-tone: coloured background
    if avg_saturation > 55 and avg_brightness < 200:
        top_half_bright = float(header_gray[: header_h // 2, :].mean())
        bot_half_bright = float(header_gray[header_h // 2 :, :].mean())
        if abs(top_half_bright - bot_half_bright) > 35:
            return "two-tone", 0.70
        return "banner-accent", 0.75

    # line-accent: small coloured strip at the very top (~top 4 % of header)
    top_strip = header_hsv[: max(1, header_h // 5), :, 1]
    if float(top_strip.mean()) > 45 and avg_saturation < 50:
        return "line-accent", 0.65

    # Text distribution analysis
    _, text_mask = cv2.threshold(header_gray, 160, 255, cv2.THRESH_BINARY_INV)
    col_sum = text_mask.sum(axis=0).astype(float)
    if col_sum.max() == 0:
        return "stack-left", 0.40

    col_norm = col_sum / col_sum.max()
    active = np.where(col_norm > 0.08)[0]
    if len(active) == 0:
        return "stack-left", 0.40

    leftmost = int(active[0])
    rightmost = int(active[-1])
    text_center = (leftmost + rightmost) / 2.0

    # split: text reaches both far edges with a low-density centre gap
    if leftmost < w * 0.12 and rightmost > w * 0.80:
        mid_gap = col_norm[w // 3 : 2 * w // 3]
        if float(mid_gap.min()) < 0.10:
            return "split", 0.70

    # underbar: strong horizontal edge at the bottom of the header region
    if header_h > 8:
        bottom_strip = header_gray[int(header_h * 0.75) :, :]
        edges = cv2.Sobel(bottom_strip, cv2.CV_64F, 0, 1, ksize=3)
        if float(np.abs(edges).mean()) > 6:
            return "underbar", 0.60

    # stack-center
    if abs(text_center - w / 2.0) < w * 0.15:
        return "stack-center", 0.65

    return "stack-left", 0.60


# ── Section style detection ──────────────────────────────────────────────────


def _detect_section_style(img_rgb: np.ndarray, h: int, w: int) -> tuple[str, float]:
    """
    Detect section-title decoration by analysing the body region (20 – 85 % of h).

    Signals checked in priority order:
      filled    → rows where > 30 % of width is dark bg
      left-bar  → persistent dark strip in the leftmost 4 % of columns
      overline  → edge-dense rows close to top of each section block
      underline → edge-dense rows (horizontal edges common in body)
      badge     → small dark rounded blobs in section-title rows
      side-dot  → isolated dark pixel cluster on the far left of title rows
      flanked   → symmetric horizontal lines flanking title text
      caps      → minimal decoration (fallback)
    """
    body_start = int(h * 0.20)
    body_end = int(h * 0.85)
    body_bgr = img_rgb[body_start:body_end, :]
    body_gray = cv2.cvtColor(body_bgr, cv2.COLOR_BGR2GRAY)
    bh, bw = body_gray.shape

    if bh < 10 or bw < 10:
        return "caps", 0.30

    _, dark_mask = cv2.threshold(body_gray, 100, 255, cv2.THRESH_BINARY_INV)
    dark_row_coverage = (dark_mask > 0).mean(axis=1)  # fraction of dark pixels per row

    # filled: multiple rows with >30 % dark coverage (section bg chips)
    filled_rows = int((dark_row_coverage > 0.30).sum())
    if filled_rows > max(3, bh * 0.03):
        return "filled", 0.65

    # left-bar: left 3 % of columns persistently dark
    left_w = max(1, int(bw * 0.03))
    left_strip = dark_mask[:, :left_w]
    left_density = float(left_strip.mean()) / 255
    if left_density > 0.12:
        return "left-bar", 0.70

    # Horizontal-edge analysis
    edges = cv2.Sobel(body_gray.astype(np.float32), cv2.CV_32F, 0, 1, ksize=3)
    horiz_strength = np.abs(edges).mean(axis=1)
    threshold = horiz_strength.mean() + horiz_strength.std() * 1.2
    strong_rows = int((horiz_strength > threshold).sum())

    if strong_rows > max(2, bh * 0.03):
        # Distinguish overline vs underline by checking if edges are
        # immediately before (overline) or after (underline) text rows.
        # Simplification: underline is more common, use it as default.
        return "underline", 0.60

    # badge: small isolated dark blobs (section pills)
    contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    small_blobs = [c for c in contours if 50 < cv2.contourArea(c) < 2000]
    if len(small_blobs) > 3:
        return "badge", 0.55

    # side-dot: very small isolated cluster in the leftmost 8 % of columns
    left_blobs = [c for c in small_blobs if cv2.boundingRect(c)[0] < bw * 0.08]
    if len(left_blobs) > 1:
        return "side-dot", 0.55

    return "caps", 0.45


# ── Sidebar background detection ─────────────────────────────────────────────


def _detect_sidebar_bg(
    img_rgb: np.ndarray,
    h: int,
    w: int,
    shell: str,
    sidebar_width_pct: int,
) -> tuple[str, float]:
    """
    Classify the sidebar background colour into one of the six SidebarBgMode
    values by analysing the average RGB and saturation of the sidebar region.
    """
    if shell == "sidebar-left":
        sb_w = max(1, int(w * sidebar_width_pct / 100))
        sidebar = img_rgb[:, :sb_w, :]
    elif shell == "sidebar-right":
        sb_w = max(1, int(w * sidebar_width_pct / 100))
        sidebar = img_rgb[:, w - sb_w :, :]
    else:
        return "dark-navy", 0.30

    avg_rgb = sidebar.mean(axis=(0, 1))  # BGR order from cv2
    b, g, r = float(avg_rgb[0]), float(avg_rgb[1]), float(avg_rgb[2])
    brightness = (r + g + b) / 3.0

    sidebar_hsv = cv2.cvtColor(sidebar, cv2.COLOR_BGR2HSV)
    avg_sat = float(sidebar_hsv[:, :, 1].mean())

    if brightness < 65:
        return ("dark-charcoal", 0.75) if avg_sat < 25 else ("dark-navy", 0.70)

    if brightness < 120:
        if avg_sat > 40:
            return "dark-accent", 0.65
        return "dark-navy", 0.60

    if brightness > 220:
        # Near-white; warm tint vs neutral
        warm = abs(r - b) > 12 or abs(r - g) > 12
        return ("light-warm", 0.65) if warm else ("light-gray", 0.70)

    # Mid-range
    if avg_sat > 30:
        return "light-accent", 0.60
    return "light-gray", 0.55


# ── Uppercase detection ───────────────────────────────────────────────────────


def _detect_uppercase(img_pil: Image.Image, h: int, w: int) -> tuple[bool | None, float]:
    """
    Sample the body region with Tesseract to detect whether section titles
    appear in ALL CAPS. Returns (is_uppercase | None, confidence).
    """
    body = img_pil.crop((0, int(h * 0.20), w, int(h * 0.82)))
    try:
        text = pytesseract.image_to_string(body, config="--psm 6")
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        # Candidate section headers: 1-5 words, reasonably short lines
        candidates = [ln for ln in lines if 1 <= len(ln.split()) <= 5 and 3 < len(ln) < 40]
        if not candidates:
            return None, 0.25
        n_upper = sum(1 for ln in candidates if ln.isupper())
        ratio = n_upper / len(candidates)
        if ratio > 0.55:
            return True, min(0.45 + ratio * 0.30, 0.78)
        if ratio < 0.20:
            return False, 0.68
        return None, 0.30
    except Exception:  # noqa: BLE001
        return None, 0.0


# ── Default regions by shell ──────────────────────────────────────────────────

_DEFAULT_REGIONS: dict[str, dict[str, list[str]]] = {
    "single": {"main": ["summary", "experience", "education", "skills", "certifications"]},
    "sidebar-left": {
        "main": ["summary", "experience", "education"],
        "sidebar": ["contact", "skills", "languages"],
    },
    "sidebar-right": {
        "main": ["summary", "experience", "education"],
        "sidebar": ["contact", "skills", "certifications"],
    },
    "two-column": {
        "main": ["summary", "experience", "education"],
        "sidebar": ["skills", "certifications", "languages"],
    },
}


# ── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        version = str(pytesseract.get_tesseract_version())
    except Exception:  # noqa: BLE001
        version = None
    return HealthResponse(ok=True, tesseract_version=version, markitdown=_markitdown is not None)


# Extensions MarkItDown handles well as a structured-text source. Image-only
# formats are intentionally excluded — those go through OCR / premium vision.
_CONVERT_EXTENSIONS = {
    ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
    ".pdf", ".html", ".htm", ".csv", ".json", ".xml", ".rtf", ".epub", ".txt",
}


def _ext_of(filename: str) -> str:
    dot = filename.rfind(".")
    return filename[dot:].lower() if dot != -1 else ""


@app.post("/convert/document", response_model=ConvertResponse)
async def convert_document(file: UploadFile = File(...)) -> ConvertResponse:
    """
    Convert a document (DOCX, PDF text-layer, XLSX, PPTX, HTML, …) to clean
    Markdown via MarkItDown. Returns ONLY the extracted text — the Next.js
    side owns AI parsing and persistence.

    Returns 422 (not 500) when extraction yields too little text so the caller
    can fall back to premium vision (e.g. scanned/image-only PDFs).
    """
    if _markitdown is None:
        raise HTTPException(status_code=503, detail="markitdown not installed")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty file")

    ext = _ext_of(file.filename or "")
    if ext and ext not in _CONVERT_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"unsupported extension: {ext}")

    try:
        result = _markitdown.convert_stream(
            io.BytesIO(payload),
            file_extension=ext or None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"conversion failed: {exc}") from exc

    markdown = (result.text_content or "").strip()
    if len(markdown) < 50:
        # Too little text — likely a scanned/image PDF. Signal fallback.
        raise HTTPException(status_code=422, detail="insufficient text extracted")

    log.info("convert: chars=%d ext=%s file=%s", len(markdown), ext, file.filename)
    return ConvertResponse(markdown=markdown, chars=len(markdown))


@app.post("/extract/ocr", response_model=OcrResponse)
async def extract_ocr(file: UploadFile = File(...)) -> OcrResponse:
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty file")

    img = _load_pil(payload)
    gray_pil = img.convert("L")

    raw_text = pytesseract.image_to_string(gray_pil)
    data = pytesseract.image_to_data(gray_pil, output_type=pytesseract.Output.DICT)
    confidence = _confidence_from_tesseract(data)

    log.info("ocr: chars=%d conf=%.2f file=%s", len(raw_text), confidence, file.filename)
    return OcrResponse(rawText=raw_text.strip(), confidence=confidence)


@app.post("/extract/layout", response_model=LayoutResponse)
async def extract_layout(file: UploadFile = File(...)) -> LayoutResponse:
    """
    Phase 6: full OpenCV layout analysis.

    Detection pipeline (in order):
      1. Shell + sidebar width  (column-density + brightness-edge scan)
      2. Header style           (brightness, saturation, text distribution)
      3. Section style          (dark-coverage, edge density, blob detection)
      4. Sidebar bg             (colour analysis of the sidebar strip)
      5. Uppercase              (Tesseract on body region)

    Each sub-detector returns a (value, sub_confidence) pair.
    The overall confidence is the trimmed mean of sub-confidences.
    """
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty file")

    img_pil = _load_pil(payload)
    w_orig, h_orig = img_pil.size

    # Work at a normalised resolution for speed; A4-portrait proportions
    TARGET_W = 794
    scale = TARGET_W / max(w_orig, 1)
    target_h = int(h_orig * scale)
    img_pil_scaled = img_pil.resize((TARGET_W, target_h), Image.LANCZOS)
    img_rgb = cv2.cvtColor(np.asarray(img_pil_scaled), cv2.COLOR_RGB2BGR)
    h, w = img_rgb.shape[:2]

    sub_confs: list[float] = []

    # 1. Shell
    shell, sidebar_width_pct, shell_conf = _detect_shell(img_rgb, h, w)
    sub_confs.append(shell_conf)

    if sidebar_width_pct is None and shell in ("sidebar-left", "sidebar-right"):
        sidebar_width_pct = 30

    # 2. Header style
    header, header_conf = _detect_header_style(img_rgb, h, w)
    sub_confs.append(header_conf)

    # 3. Section style
    section, section_conf = _detect_section_style(img_rgb, h, w)
    sub_confs.append(section_conf)

    # 4. Sidebar bg (only for sidebar shells)
    sidebar_bg: str | None = None
    if shell in ("sidebar-left", "sidebar-right") and sidebar_width_pct:
        sidebar_bg, sb_conf = _detect_sidebar_bg(img_rgb, h, w, shell, sidebar_width_pct)
        sub_confs.append(sb_conf)

    # 5. Uppercase
    uppercase, uc_conf = _detect_uppercase(img_pil_scaled, h, w)
    if uc_conf > 0:
        sub_confs.append(uc_conf)

    # Overall confidence: trim the lowest quartile, average the rest
    sub_confs_sorted = sorted(sub_confs)
    trim = max(1, len(sub_confs_sorted) - len(sub_confs_sorted) // 4)
    confidence = round(sum(sub_confs_sorted[:trim]) / trim, 3)

    regions = _DEFAULT_REGIONS.get(shell, _DEFAULT_REGIONS["single"])

    log.info(
        "layout: shell=%s header=%s section=%s sidebar_bg=%s uc=%s conf=%.2f file=%s",
        shell, header, section, sidebar_bg, uppercase, confidence, file.filename,
    )

    return LayoutResponse(
        shell=shell,
        regions=regions,
        header=header,
        section=section,
        uppercase=uppercase,
        sidebarWidthPct=sidebar_width_pct,
        sidebarBg=sidebar_bg,
        confidence=confidence,
    )
