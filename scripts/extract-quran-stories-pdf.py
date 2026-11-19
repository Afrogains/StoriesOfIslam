#!/usr/bin/env python3
"""Extract Stories of the Quran chapters from the bundled Ibn Kathir PDF."""

from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "mobile/public/sources/ibn-kathir-stories-of-the-quran.pdf"
OUT_JSON = ROOT / "mobile/src/data/quranStoriesFromPdf.json"
OUT_INDEX = ROOT / "mobile/src/data/quranStoriesPdfIndex.ts"

CHAPTERS = [
    {
        "n": 1,
        "slug": "quran-habil-qabil",
        "re": r"The Story of Habil and Qabil",
        "titleEn": "Habil and Qabil",
        "titleAr": "هابيل وقابيل",
        "nameEn": "Habil and Qabil",
        "nameAr": "هابيل وقابيل",
    },
    {
        "n": 2,
        "slug": "quran-harut-marut",
        "re": r"^Harut and Marut\b",
        "titleEn": "Harut and Marut",
        "titleAr": "هاروت وماروت",
        "nameEn": "Harut and Marut",
        "nameAr": "هاروت وماروت",
    },
    {
        "n": 3,
        "slug": "quran-dwellers-of-the-town",
        "re": r"Dwellers of the Town",
        "titleEn": "Dwellers of the Town",
        "titleAr": "أصحاب القرية",
        "nameEn": "Dwellers of the Town",
        "nameAr": "أصحاب القرية",
    },
    {
        "n": 4,
        "slug": "quran-the-heifer",
        "re": r"Story of the Heifer",
        "titleEn": "The Story of the Heifer",
        "titleAr": "قصة البقرة",
        "nameEn": "The Heifer",
        "nameAr": "البقرة",
    },
    {
        "n": 5,
        "slug": "quran-musa-and-al-khidr",
        "re": r"Moses and A[Il]-Khadir|Moses and Al-Khidr",
        "titleEn": "Musa and Al-Khidr",
        "titleAr": "موسى والخضر",
        "nameEn": "Musa and Al-Khidr",
        "nameAr": "موسى والخضر",
    },
    {
        "n": 6,
        "slug": "quran-qarun",
        "re": r"The Story of Qarun",
        "titleEn": "The Story of Qarun",
        "titleAr": "قصة قارون",
        "nameEn": "Qarun",
        "nameAr": "قارون",
    },
    {
        "n": 7,
        "slug": "quran-bilqis",
        "re": r"^Bilqis",
        "titleEn": "Bilqis, Queen of Sheba",
        "titleAr": "بلقيس ملكة سبأ",
        "nameEn": "Bilqis",
        "nameAr": "بلقيس",
    },
    {
        "n": 8,
        "slug": "quran-saba",
        "re": r"The Story of Saba",
        "titleEn": "The Story of Saba'",
        "titleAr": "قصة سبأ",
        "nameEn": "Saba'",
        "nameAr": "سبأ",
    },
    {
        "n": 9,
        "slug": "quran-uzair",
        "re": r"Uzair",
        "titleEn": "Uzair",
        "titleAr": "عزير",
        "nameEn": "Uzair",
        "nameAr": "عزير",
    },
    {
        "n": 10,
        "slug": "quran-dhul-qarnayn",
        "re": r"Dhul Qarnain|Dhul-Qarnain|Dhul-Qarnayn",
        "titleEn": "Dhul-Qarnayn",
        "titleAr": "ذو القرنين",
        "nameEn": "Dhul-Qarnayn",
        "nameAr": "ذو القرنين",
    },
    {
        "n": 11,
        "slug": "quran-gog-and-magog",
        "re": r"Gog and Magog",
        "titleEn": "Gog and Magog",
        "titleAr": "يأجوج ومأجوج",
        "nameEn": "Ya'juj and Ma'juj",
        "nameAr": "يأجوج ومأجوج",
    },
    {
        "n": 12,
        "slug": "quran-people-of-the-cave",
        "re": r"People of the Cave",
        "titleEn": "People of the Cave",
        "titleAr": "أصحاب الكهف",
        "nameEn": "People of the Cave",
        "nameAr": "أصحاب الكهف",
    },
    {
        "n": 13,
        "slug": "quran-believer-and-disbeliever",
        "re": r"The Believer",
        "titleEn": "The Believer and the Disbeliever",
        "titleAr": "المؤمن والكافر",
        "nameEn": "The Believer and the Disbeliever",
        "nameAr": "المؤمن والكافر",
    },
    {
        "n": 14,
        "slug": "quran-people-of-the-garden",
        "re": r"People of the Garden",
        "titleEn": "People of the Garden",
        "titleAr": "أصحاب الجنة",
        "nameEn": "People of the Garden",
        "nameAr": "أصحاب الجنة",
    },
    {
        "n": 15,
        "slug": "quran-sabbath-breakers",
        "re": r"The Sabbath-Breakers",
        "titleEn": "The Sabbath-Breakers",
        "titleAr": "أصحاب السبت",
        "nameEn": "The Sabbath-Breakers",
        "nameAr": "أصحاب السبت",
    },
    {
        "n": 16,
        "slug": "quran-luqman",
        "re": r"Story of Luqman",
        "titleEn": "The Story of Luqman",
        "titleAr": "قصة لقمان",
        "nameEn": "Luqman",
        "nameAr": "لقمان",
    },
    {
        "n": 17,
        "slug": "quran-people-of-the-ditch",
        "re": r"People of the Ditch",
        "titleEn": "People of the Ditch",
        "titleAr": "أصحاب الأخدود",
        "nameEn": "People of the Ditch",
        "nameAr": "أصحاب الأخدود",
    },
    {
        "n": 18,
        "slug": "quran-barsisa",
        "re": r"Barsisa",
        "titleEn": "Barsisa the Worshipper",
        "titleAr": "برصيصا العابد",
        "nameEn": "Barsisa",
        "nameAr": "برصيصا",
    },
    {
        "n": 19,
        "slug": "quran-owners-of-the-elephant",
        "re": r"Owners of the Elephant",
        "titleEn": "Owners of the Elephant",
        "titleAr": "أصحاب الفيل",
        "nameEn": "Owners of the Elephant",
        "nameAr": "أصحاب الفيل",
    },
]


def clean_page(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"www\.\S+", "", text, flags=re.I)
    replacements = [
        (r"\bAI-", "Al-"),
        (r"\bAI([A-Z])", r"Al-\1"),
        (r"AI-Khadir", "Al-Khidr"),
        (r"Al-Khadir", "Al-Khidr"),
        (r"AIHikmah", "Al-Hikmah"),
        (r"\b0 Muhammad\b", "O Muhammad"),
        (r"\b0 Lord\b", "O Lord"),
        (r"\b0 my\b", "O my"),
        (r"\b0 Allah\b", "O Allah"),
        (r"\b0 Dhul\b", "O Dhul"),
        (r"\b0 you\b", "O you"),
        (r"Qarun\(Korah\)", "Qarun (Korah)"),
        (r"Bilqis\(Queen", "Bilqis (Queen"),
        (r"Saba'\(Sheba\)", "Saba' (Sheba)"),
        (r"`\s*Uzair\(Ezra\)", "'Uzair (Ezra)"),
        (r"In the Name ofAllah", "In the Name of Allah"),
        (r"IbnKatheer", "Ibn Katheer"),
        (r"  +", " "),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    return text.strip()


def split_sections(body: str) -> list[dict[str, str]]:
    lines = [line.rstrip() for line in body.split("\n")]
    sections: list[dict[str, str]] = []
    heading = "Account"
    buf: list[str] = []

    def flush() -> None:
        nonlocal buf
        text = re.sub(r"\n{3,}", "\n\n", "\n".join(buf)).strip()
        if text:
            sections.append({"heading": heading, "body": text})
        buf = []

    heading_re = re.compile(r"^[A-Z][\w’'\- (),:]{2,78}$")
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            buf.append("")
            continue
        is_heading = (
            len(trimmed) <= 80
            and not re.search(r"[.!?]$", trimmed)
            and not trimmed.startswith(("\"", "“", "{"))
            and not re.match(r"^(Allah|He said|They said|We said|Narrated)\b", trimmed)
            and heading_re.match(trimmed) is not None
            and len(trimmed.split()) <= 10
        )
        if is_heading and any(x.strip() for x in buf):
            flush()
            heading = trimmed
            continue
        if is_heading and not any(x.strip() for x in buf):
            heading = trimmed
            continue
        buf.append(trimmed)
    flush()
    if not sections and body.strip():
        sections.append({"heading": "Account", "body": body.strip()})
    return sections


def summarize(text: str, max_len: int = 220) -> str:
    flat = re.sub(r"\s+", " ", text).strip()
    if len(flat) <= max_len:
        return flat
    cut = flat[:max_len]
    last = cut.rfind(". ")
    return (cut[: last + 1] if last > 80 else f"{cut.rstrip()}…").strip()


def strip_chapter_header(chunk: str, title_re: str) -> str:
    chunk = re.sub(r"In the Name of Allah[^\n]*\n+", "", chunk, flags=re.I)
    chunk = re.sub(r"^\(\d+\)\s*\n+", "", chunk)
    chunk = re.sub(rf"^({title_re})[^\n]*\n+", "", chunk, flags=re.I | re.M)
    chunk = re.sub(r"^“Able and Cain”[^\n]*\n+", "", chunk)
    chunk = re.sub(r"^\(The Renegade\)\s*\n+", "", chunk)
    return chunk.strip()


def main() -> None:
    reader = PdfReader(str(PDF))
    pages = [clean_page(page.extract_text() or "") for page in reader.pages]
    starts: list[dict] = []
    for index, page in enumerate(pages):
        # Front matter (title, TOC, notes, biography) occupies pages 1–6.
        if index < 6:
            continue
        head = "\n".join(page.split("\n")[:12])
        if not re.search(r"In the Name of Allah", head, flags=re.I):
            continue
        for chapter in CHAPTERS:
            if any(item["slug"] == chapter["slug"] for item in starts):
                continue
            if re.search(chapter["re"], head, flags=re.I | re.M):
                starts.append({**chapter, "page": index + 1})
                break

    if len(starts) != len(CHAPTERS):
        found = {item["slug"] for item in starts}
        missing = [item["slug"] for item in CHAPTERS if item["slug"] not in found]
        raise SystemExit(f"Missing chapters: {missing}")

    chapters: dict[str, dict] = {}
    page_index: dict[str, dict] = {}
    for i, cur in enumerate(starts):
        end_page = (starts[i + 1]["page"] if i + 1 < len(starts) else len(pages) + 1) - 1
        chunk = strip_chapter_header("\n\n".join(pages[cur["page"] - 1 : end_page]), cur["re"])
        sections = split_sections(chunk)
        if sections and sections[0]["heading"] == "Account":
            sections[0]["heading"] = cur["titleEn"]
        content_en = "\n\n".join(f"{section['heading']}\n\n{section['body']}" for section in sections)
        words = len(re.findall(r"\S+", content_en))
        duration_ms = max(120_000, round((words / 150) * 60_000))
        chapters[cur["slug"]] = {
            "slug": cur["slug"],
            "sortOrder": cur["n"],
            "titleEn": cur["titleEn"],
            "titleAr": cur["titleAr"],
            "nameEn": cur["nameEn"],
            "nameAr": cur["nameAr"],
            "contentEn": content_en,
            "summaryEn": summarize(content_en),
            "sections": sections,
            "durationMs": duration_ms,
            "sourceCitation": (
                "Ibn Kathir, Stories of the Quran — English translation by Ali As-Sayed "
                "Al-Halawani (bundled in-app)"
            ),
            "pdfPageStart": cur["page"],
            "pdfPageEnd": end_page,
        }
        page_index[cur["slug"]] = {
            "start": cur["page"],
            "end": end_page,
            "nameEn": cur["titleEn"],
        }

    OUT_JSON.write_text(json.dumps(chapters, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_INDEX.write_text(
        f"""/**
 * Canonical in-app source for Stories of the Quran: Ibn Kathir
 * (English translation by Ali As-Sayed Al-Halawani).
 */
export const QURAN_STORIES_PDF = {{
  title: 'Stories of the Quran',
  author: 'Al-Imam Ibn Kathir',
  translator: 'Ali As-Sayed Al-Halawani',
  edition: 'English PDF (bundled in-app)',
  publicPath: '/sources/ibn-kathir-stories-of-the-quran.pdf',
  pageCount: {len(pages)},
}} as const;

export type QuranStoryPdfSpan = {{ start: number; end: number; nameEn: string }};

export const quranStoriesPdfPages: Record<string, QuranStoryPdfSpan> = {json.dumps(page_index, indent=2)} as const;

export function quranStoriesPdfUrl(page?: number): string {{
  const base = QURAN_STORIES_PDF.publicPath;
  if (!page || page < 1) return base;
  return `${{base}}#page=${{page}}`;
}}

export function quranStoryPdfSpanForSlug(slug: string): QuranStoryPdfSpan | null {{
  return quranStoriesPdfPages[slug] ?? null;
}}
""",
        encoding="utf-8",
    )
    print(f"Extracted {len(chapters)} chapters from {len(pages)} pages → {OUT_JSON}")


if __name__ == "__main__":
    main()
