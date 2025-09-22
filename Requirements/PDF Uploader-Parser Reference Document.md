Awesome—adding PDF script uploads is totally doable. Think of it as a 2-track pipeline:

Do you
Scanned PDFs (images): run OCR first to create a searchable text layer, then do the same mapping.

Below is a pragmatic blueprint + working starter code you can drop into a Python service. You can adapt the same ideas in Node/Go/Java if you prefer.

The pipeline (overview)

Ingest & classify

Detect whether the PDF already has extractable text.

Get page size (points), count, and a quick density check.

If scanned

Run OCR to generate a text layer (e.g., ocrmypdf CLI, Tesseract via pytesseract, or your OCR of choice).

Re-ingest the OCR’d PDF for text extraction.

Structured extraction

Use a layout engine (recommended: PyMuPDF / fitz) to get per-page words/lines with bounding boxes and (if available) font sizes.

Strip highly-repeated headers/footers (same text at very similar Y on most pages).

Preserve page breaks (you’ll need them for (MORE)/(CONT’D), revision “A” pages, etc.).

Element detection (heuristics)

Scene headings: line starts with INT, EXT, EST, INT/EXT, I/E (case-insensitive) and is mostly uppercase.

Transitions: ALL CAPS line ending in TO: and right-aligned (x₁ near right margin).

Character cues: ALL CAPS, short (≤ 40 chars), indented further than action, often centered-ish.

Dialogue: lines under a character cue with narrower width (indented more than action).

Parentheticals: a short line starting with ( and ending ), indented between character and dialogue.

Action: everything else (left-aligned paragraph lines).

Dual dialogue: two dialogue blocks on the same vertical band with different left indents.

Manual page breaks: inherent from PDF pages; keep them.

Tip: either (a) use fixed “screenplay bands” (in points) for indents, or (b) learn the bands per document by clustering the left-x of lines into 3–5 buckets, then labeling buckets by content (UPPERCASE → character/transition, etc.).

Normalize output

Convert to your internal AST (element type, text, page, bbox, attrs).

Optionally export Fountain or Final Draft XML (FDX) alongside your AST.

Post-processing

Detect and strip (MORE)/(CONT’D) that are purely layout artifacts.

Keep revision marks (colored asterisks in margins), A/B pages, and locked page numbers if you need production support.

Useful libraries (Python)

PyMuPDF (fitz) — fast, reliable text + bbox extraction.

pdfplumber — nice for table/line grouping; slower but very readable API.

pdfminer.six — pure text extraction; less layout-aware than PyMuPDF.

OCR: ocrmypdf (wraps Tesseract, adds text layer to PDF), or pytesseract on page images.

(You don’t have to lock into versions here; all are mature and widely used.)

Starter code (Python, end-to-end)

Drops a PDF in, gives you an element stream you can turn into Fountain or your own JSON AST. It handles: text-vs-scanned detection, optional OCR hook, line reconstruction, basic screenplay classification, and header/footer removal.

# pdf_script_parser.py
# Minimal PDF→Screenplay element extractor (text-based PDFs + OCR fallback)
# pip install pymupdf regex

import os
import subprocess
import re
import fitz  # PyMuPDF

UPPER_RE = re.compile(r'^[A-Z0-9 @#\-\.\(\)\'"]+$')
SCENE_RE = re.compile(r'^\s*(?:INT|EXT|I/E|INT/EXT|EST)\b', re.I)
TRANSITION_RE = re.compile(r'^[A-Z0-9 \-\._]+ TO:\s*$')
PAREN_RE = re.compile(r'^\(.*\)$')

def has_text_layer(pdf_path, sample_pages=3):
    with fitz.open(pdf_path) as doc:
        for i in range(min(sample_pages, len(doc))):
            if doc[i].get_text("text").strip():
                return True
    return False

def ocr_pdf(in_path, out_path):
    # Requires: ocrmypdf CLI installed on your system (or replace with your OCR flow)
    subprocess.run(
        ["ocrmypdf", "--skip-text", "--deskew", "--optimize", "1", in_path, out_path],
        check=True
    )
    return out_path

def load_lines_with_boxes(pdf_path):
    """
    Returns: list of pages, each is list of dicts:
      { "text": line_text, "x0": float, "x1": float, "y0": float, "y1": float, "size": float }
    The lines are reconstructed from words with similar Y.
    """
    pages = []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            words = page.get_text("words")  # list of (x0, y0, x1, y1, "word", block_no, line_no, word_no)
            if not words:
                pages.append([])
                continue

            # group words by line_no
            words.sort(key=lambda w: (w[6], w[0]))  # sort by y (line_no) then x
            lines = []
            current_line_no = None
            buf = []

            for (x0, y0, x1, y1, wtext, block_no, line_no, word_no) in words:
                if current_line_no is None:
                    current_line_no = line_no
                if line_no != current_line_no:
                    if buf:
                        x0_l = min(b[0] for b in buf)
                        x1_l = max(b[2] for b in buf)
                        y0_l = min(b[1] for b in buf)
                        y1_l = max(b[3] for b in buf)
                        line_text = " ".join(b[4] for b in buf).strip()
                        # naive font size approximation via bbox height
                        size = y1_l - y0_l
                        lines.append({"text": line_text, "x0": x0_l, "x1": x1_l, "y0": y0_l, "y1": y1_l, "size": size})
                    buf = []
                    current_line_no = line_no
                buf.append((x0, y0, x1, y1, wtext))
            if buf:
                x0_l = min(b[0] for b in buf)
                x1_l = max(b[2] for b in buf)
                y0_l = min(b[1] for b in buf)
                y1_l = max(b[3] for b in buf)
                line_text = " ".join(b[4] for b in buf).strip()
                size = y1_l - y0_l
                lines.append({"text": line_text, "x0": x0_l, "x1": x1_l, "y0": y0_l, "y1": y1_l, "size": size})

            pages.append(lines)
    return pages

def remove_headers_footers(pages, tolerance=6):
    """
    Drop lines that repeat on most pages at (approx) the same y.
    Useful for page headers like "PROJECT NAME — Page 1".
    """
    from collections import Counter
    ys_top = Counter()
    ys_bot = Counter()
    for p in pages:
        if not p: 
            continue
        # take top-most & bottom-most line y
        ys_top[round(p[0]["y0"]/tolerance)*tolerance] += 1
        ys_bot[round(p[-1]["y0"]/tolerance)*tolerance] += 1

    # define a “repeats on many pages” threshold
    threshold = max(2, int(0.6 * len(pages)))

    drop_top_y = {y for y,c in ys_top.items() if c >= threshold}
    drop_bot_y = {y for y,c in ys_bot.items() if c >= threshold}

    cleaned = []
    for p in pages:
        newp = []
        for ln in p:
            ybucket = round(ln["y0"]/tolerance)*tolerance
            if ybucket in drop_top_y or ybucket in drop_bot_y:
                # also require the text to be short & page-numberish to reduce false positives
                if len(ln["text"]) <= 40:
                    continue
            newp.append(ln)
        cleaned.append(newp)
    return cleaned

def classify_lines(pages, page_width_points):
    """
    Convert raw lines to screenplay elements using indent bands + content heuristics.
    Returns a list of elements: {type, text, page, x0, x1}
    """
    elements = []
    # rough screenplay bands in points (1 inch = 72 pt); tune per document if needed
    left_margin = 72  # 1"
    action_band = left_margin + 0      # ~ 1.0"
    dialogue_band = left_margin + 108  # ~ 2.5"
    char_band = left_margin + 180      # ~ 3.5"
    paren_band = left_margin + 150     # ~ 3.1"
    right_margin = page_width_points - 72

    pending_char = None

    for pageno, lines in enumerate(pages, start=1):
        i = 0
        while i < len(lines):
            ln = lines[i]
            text = ln["text"].strip()
            x0, x1 = ln["x0"], ln["x1"]

            # Skip empties
            if not text:
                i += 1
                continue

            # SCENE
            if SCENE_RE.match(text) and text == text.upper():
                elements.append({"type": "scene", "text": text, "page": pageno, "x0": x0, "x1": x1})
                pending_char = None
                i += 1
                continue

            # TRANSITION (right aligned ALL CAPS ... TO:)
            if UPPER_RE.match(text) and TRANSITION_RE.match(text) and (right_margin - x1) < 40:
                elements.append({"type": "transition", "text": text, "page": pageno, "x0": x0, "x1": x1})
                pending_char = None
                i += 1
                continue

            # CHARACTER cue (ALL CAPS, short, indented more than dialogue_band)
            if UPPER_RE.match(text) and len(text) <= 40 and x0 >= char_band:
                elements.append({"type": "character", "text": text, "page": pageno, "x0": x0, "x1": x1})
                pending_char = True
                i += 1
                continue

            # PARENTHETICAL (between character and dialogue bands)
            if PAREN_RE.match(text) and (paren_band <= x0 <= (dialogue_band + 40)):
                elements.append({"type": "parenthetical", "text": text, "page": pageno, "x0": x0, "x1": x1})
                i += 1
                continue

            # DIALOGUE (narrow indent), typically after a character cue
            if (x0 >= dialogue_band) and (x0 < char_band + 60) and (pending_char or i > 0):
                elements.append({"type": "dialogue", "text": text, "page": pageno, "x0": x0, "x1": x1})
                # do not reset pending_char so consecutive dialogue lines are grouped by consumer
                i += 1
                continue

            # ACTION (default)
            elements.append({"type": "action", "text": text, "page": pageno, "x0": x0, "x1": x1})
            pending_char = None
            i += 1

        # page break element to preserve PDF pages
        elements.append({"type": "page_break", "text": "", "page": pageno, "x0": 0, "x1": 0})

    return elements

def parse_pdf_script(pdf_path, tmp_dir="/tmp"):
    src = pdf_path
    # 1) Detect text layer; OCR if needed
    if not has_text_layer(pdf_path):
        ocr_out = os.path.join(tmp_dir, "ocrd.pdf")
        src = ocr_pdf(pdf_path, ocr_out)

    # 2) Extract lines with bboxes
    with fitz.open(src) as doc:
        page_width = doc[0].rect.width  # assume same width across pages
    pages = load_lines_with_boxes(src)

    # 3) Remove repeating header/footer
    pages = remove_headers_footers(pages)

    # 4) Classify to screenplay elements
    elements = classify_lines(pages, page_width_points=page_width)

    return elements

if __name__ == "__main__":
    import json
    pdf = "your_script.pdf"
    elements = parse_pdf_script(pdf)
    # Example: dump to JSON for your app
    print(json.dumps(elements[:200], indent=2))  # show first 200 elements

How to use the output

You’ll get a stream like:

{"type": "scene", "text": "INT. KITCHEN - NIGHT", "page": 1, ...}
{"type": "character", "text": "RAVI", "page": 1, ...}
{"type": "dialogue", "text": "I can't do this.", "page": 1, ...}
{"type": "page_break", "page": 1}


From there you can:

Group consecutive dialogue lines under the last character.

Join action lines into paragraphs.

Export to Fountain or FDX.

Keep page_break for accurate page counts and (MORE)/(CONT’D) logic.

Handling tricky cases

Dual dialogue: same Y-band, two dialogue blocks with different x0 buckets → mark as dialogue_left / dialogue_right.

Weird fonts/margins: if the fixed bands misclassify, auto-learn bands: collect all x0 values, cluster into 3–5 buckets (e.g., k-means), then map buckets → {action, dialogue, character, parenthetical} based on content (UPPER vs not, parentheses, width).

(MORE)/(CONT’D): if the line is at the end/start of a page and matches (MORE) or (CONT’D), treat as a layout artifact flag, not actual dialogue content.

Revisions / A-pages: preserve PDF page numbers and any marginal asterisks; surface them on your AST nodes as revision_mark=True.

Watermarks/footers: the “repeated line at similar Y across pages” rule removes most; you can also whitelist/blacklist via regex.

Production tips

Performance: PyMuPDF is fast; you can parallelize across pages. OCR is the only slow step—cache the OCR’d result.

Security: Strip embedded JavaScript, ignore external links. Sanitize output if you’re re-hosting.

Configurability: expose the indent bands as per-document overrides so users can tune if needed.

Testing: assemble a corpus: Final Draft exports, Celtx, WriterDuet, Highland PDFs, scanned scripts, and revision-heavy studio drafts.