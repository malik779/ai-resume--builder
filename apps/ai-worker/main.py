"""
AI Worker — local OCR + layout extraction service for the AI Resume Builder.

Runs as a separate process (Docker or `uvicorn main:app --port 8000`).
The Next.js app calls it via HTTP when AI_WORKER_URL is set; if the worker is
unreachable or unhealthy the TS side falls back to premium APIs.

Endpoints:
  GET  /health                — { "ok": true } when ready
  POST /extract/ocr           — multipart 'file' → { rawText, confidence }
  POST /extract/layout        — multipart 'file' → { shell, regions, confidence }

Phase 5 (this scaffold):
  - /extract/ocr is fully wired via Tesseract + Pillow
  - /extract/layout returns a stub structure; Phase 6 fills in real layout
    detection with OpenCV

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

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
log = logging.getLogger("ai-worker")

app = FastAPI(title="AI Resume Builder — Local Worker", version="0.1.0")


class HealthResponse(BaseModel):
    ok: bool
    tesseract_version: Optional[str] = None


class OcrResponse(BaseModel):
    rawText: str
    confidence: float


class LayoutResponse(BaseModel):
    shell: str
    regions: dict[str, list[str]]
    confidence: float


# ── Helpers ─────────────────────────────────────────────────────────────────


def _load_image(payload: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(payload))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=415, detail=f"Unsupported image: {exc}") from exc


def _normalize_for_ocr(img: Image.Image) -> Image.Image:
    # Convert to grayscale + light contrast bump for cleaner OCR
    gray = img.convert("L")
    return gray


def _confidence_from_tesseract(data: dict) -> float:
    """Tesseract returns per-token confidence as a list of int strings (-1 = unknown).
    Average over the positive ones, normalize to 0..1."""
    raw = data.get("conf", [])
    nums = []
    for v in raw:
        try:
            n = int(v)
        except (ValueError, TypeError):
            continue
        if n >= 0:
            nums.append(n)
    if not nums:
        return 0.0
    avg = sum(nums) / len(nums)
    return round(avg / 100.0, 3)


# ── Routes ──────────────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        version = str(pytesseract.get_tesseract_version())
    except Exception:  # noqa: BLE001
        version = None
    return HealthResponse(ok=True, tesseract_version=version)


@app.post("/extract/ocr", response_model=OcrResponse)
async def extract_ocr(file: UploadFile = File(...)) -> OcrResponse:
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty file")

    img = _load_image(payload)
    norm = _normalize_for_ocr(img)

    # Run OCR with per-word data so we can compute a confidence average
    raw_text = pytesseract.image_to_string(norm)
    data = pytesseract.image_to_data(norm, output_type=pytesseract.Output.DICT)
    confidence = _confidence_from_tesseract(data)

    log.info(
        "ocr extracted: chars=%d confidence=%.2f file=%s",
        len(raw_text), confidence, file.filename,
    )

    return OcrResponse(rawText=raw_text.strip(), confidence=confidence)


@app.post("/extract/layout", response_model=LayoutResponse)
async def extract_layout(file: UploadFile = File(...)) -> LayoutResponse:
    """
    Phase 5 stub. Phase 6 will use OpenCV to:
      - detect column structure (single/two-column/sidebar)
      - detect section blocks (headings, bullet lists)
      - return a TemplateConfig-shaped descriptor

    For now we just look at aspect ratio + simple column detection so the
    contract exists end-to-end; the TS side already validates whatever this
    returns against the canonical TemplateConfig schema downstream.
    """
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty file")

    img = np.asarray(_load_image(payload).convert("RGB"))
    h, w = img.shape[:2]

    # Crude column detection: compute the vertical projection of dark pixels
    # in the middle band; if there's a clear gutter, call it two-column.
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    col_density = thresh.sum(axis=0) / 255  # higher = more text in that column
    mid_band = col_density[w // 4 : 3 * w // 4]
    if len(mid_band) == 0:
        gutter = 0.0
    else:
        gutter = float(mid_band.min()) / max(float(mid_band.max()), 1.0)

    # Sidebar heuristic: if the left ~30% has notably higher density than the
    # right ~70%, call it sidebar-left.
    left_density = float(col_density[: w * 30 // 100].mean()) if w > 0 else 0
    right_density = float(col_density[w * 30 // 100 :].mean()) if w > 0 else 0

    if gutter < 0.15 and abs(left_density - right_density) / max(right_density, 1) < 0.25:
        shell = "two-column"
        regions = {
            "main": ["summary", "experience", "education"],
            "sidebar": ["skills", "certifications"],
        }
        confidence = 0.55
    elif left_density > right_density * 1.4:
        shell = "sidebar-left"
        regions = {
            "main": ["summary", "experience", "education"],
            "sidebar": ["skills", "contact", "languages"],
        }
        confidence = 0.5
    else:
        shell = "single-column"
        regions = {
            "main": ["summary", "experience", "education", "skills", "certifications"],
        }
        confidence = 0.6

    log.info(
        "layout heuristic: shell=%s w=%d h=%d gutter=%.2f", shell, w, h, gutter,
    )
    return LayoutResponse(shell=shell, regions=regions, confidence=confidence)
