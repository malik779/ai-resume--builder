# AI Worker

Optional Python service for local OCR and (Phase 6+) layout extraction. The Next.js app calls it via HTTP when `AI_WORKER_URL` is set. If the worker is down or unconfigured, the TS side gracefully falls back to premium APIs (Claude vision).

## Why a separate process

- OCR (`pytesseract`) and computer-vision libraries (`opencv-python-headless`) belong in Python where the ecosystem is mature and stable.
- Keeping it isolated means the Next.js app stays a clean TypeScript-first codebase.
- The worker is **optional** — every TS caller checks `worker.available()` first and falls back to a premium path if unreachable.

## What it returns

Only structured data. No HTML, no CSS, no UI fragments. See `main.py` for the response models — `OcrResponse`, `LayoutResponse`.

## Running locally

```bash
cd apps/ai-worker
python -m venv .venv
source .venv/bin/activate     # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt

# Tesseract must be installed on your OS:
#   macOS:   brew install tesseract
#   Ubuntu:  sudo apt-get install tesseract-ocr tesseract-ocr-eng
#   Windows: https://github.com/UB-Mannheim/tesseract/wiki

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Then in the Next.js app, set:

```
AI_WORKER_URL=http://localhost:8000
```

## Running with Docker

```bash
cd apps/ai-worker
docker build -t ai-resume-worker .
docker run --rm -p 8000:8000 ai-resume-worker
```

## Endpoints

| Method | Path              | Body                       | Returns |
|--------|-------------------|----------------------------|---------|
| GET    | `/health`         | —                          | `{ ok: true, tesseract_version }` |
| POST   | `/extract/ocr`    | multipart `file` (image)   | `{ rawText, confidence }` |
| POST   | `/extract/layout` | multipart `file` (image)   | `{ shell, regions, confidence }` (Phase 5: heuristic stub; Phase 6: real) |

## Phase status

- **Phase 5**: `/health` and `/extract/ocr` are real. `/extract/layout` is a heuristic placeholder so the contract can be smoke-tested end-to-end.
- **Phase 6**: real layout detection with OpenCV — section block detection, column structure, header/sidebar identification.

## Environment

- `LOG_LEVEL` — defaults to `INFO`. Use `DEBUG` while iterating on extraction.
- `PORT` — set when the container's port mapping isn't 8000.

## Hard rules (from the project's architecture)

- Returns ONLY structured data / config.
- Does NOT generate frontend UI, raw HTML, or CSS.
- Does NOT hold orchestration or business logic — that's the Next.js side's job.
- Failure must be visible: 4xx/5xx HTTP responses, never silent partial output.
