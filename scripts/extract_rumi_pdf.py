#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


PDF_PATH = Path("/Users/weijiahong/Documents/365 Days with RUMI (Dr.Ergin Ergül) (Z-Library).pdf")
OUT_PATH = Path("data/rumi-days.json")

MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def normalize(text):
    text = text.replace("\u00a0", " ")
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_months(text):
    month_lookup = {month.lower(): month for month in MONTHS}
    pattern = re.compile(r"(?im)^(%s)\s*$" % "|".join(MONTHS))
    matches = list(pattern.finditer(text))
    chunks = {}
    for index, match in enumerate(matches):
        month = month_lookup[match.group(1).lower()]
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunks[month] = text[start:end].strip()
    return chunks


def parse_month_quote(chunk):
    lines = [line.strip() for line in chunk.splitlines() if line.strip()]
    quote_lines = []
    for line in lines:
        if re.match(r"(?i)^week\s*-?\s*\d+", line):
            break
        quote_lines.append(line)
    quote = " ".join(quote_lines)
    quote = re.sub(r"\s*Rumi\s*$", "", quote, flags=re.I).strip()
    return quote


def parse_day_entries(month, chunk):
    entry_pattern = re.compile(
        r"(?m)^\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*$"
    )
    matches = list(entry_pattern.finditer(chunk))
    entries = []
    for index, match in enumerate(matches):
        weekday = match.group(1)
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(chunk)
        body = chunk[start:end]
        body = re.sub(r"(?im)^\s*WEEK\s*-?\s*\d+\s*$", "", body)
        body = re.sub(r"(?is)\n\s*ABOUT RUMI\b.*$", "", body)
        body = re.sub(r"(?is)\n\s*RUMI IN ENGLISH\b.*$", "", body)
        body = re.sub(r"(?m)^\.+\s*$", "", body)
        body = normalize(body)
        if body:
            entries.append({"month": month, "weekday": weekday, "quoteEn": body})
    return entries


def main():
    if not PDF_PATH.exists():
        print(f"Missing PDF: {PDF_PATH}", file=sys.stderr)
        return 1

    reader = PdfReader(str(PDF_PATH))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    text = normalize(text)
    month_chunks = split_months(text)

    records = []
    for month in MONTHS:
        chunk = month_chunks.get(month, "")
        if not chunk:
            continue
        month_quote = parse_month_quote(chunk)
        records.append(
            {
                "type": "month",
                "month": month,
                "monthIndex": MONTHS.index(month) + 1,
                "quoteEn": month_quote,
            }
        )
        records.extend(parse_day_entries(month, chunk))

    day_records = [record for record in records if record.get("type") != "month"]
    for index, record in enumerate(day_records, start=1):
        record["day"] = index
        record["type"] = "day"

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Extracted {len(day_records)} daily entries and {len(records) - len(day_records)} month quotes")
    if len(day_records) != 365:
        print("Note: this PDF does not expose 365 daily entries via text extraction.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
