#!/usr/bin/env python3
"""Import numbered bilingual Rumi aphorisms from Markdown into site JSON."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


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


def parse_items(markdown: str) -> list[dict[str, str | int]]:
    pattern = re.compile(
        r"^\*\*(\d+)\.\s*(.*?)\*\*\s*\n\n(.*?)(?=\n\n---\n\n\*\*\d+\.|\n\n## 后记|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    items = []
    for match in pattern.finditer(markdown):
        index = int(match.group(1))
        zh = match.group(2).strip()
        en = match.group(3).strip()
        items.append({"sourceIndex": index, "quoteZh": zh, "quoteEn": en})
    return items


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: import_bilingual_md.py SOURCE.md OUTPUT.json", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    items = parse_items(source.read_text(encoding="utf-8"))
    if len(items) < 365:
        print(f"Expected at least 365 items, found {len(items)}", file=sys.stderr)
        return 1

    records = []
    month_index = 0
    day_in_month = 0
    for day, item in enumerate(items[:365], start=1):
        month_lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        while day_in_month >= month_lengths[month_index]:
            month_index += 1
            day_in_month = 0
        day_in_month += 1
        records.append(
            {
                "type": "day",
                "id": f"day-{day}",
                "day": day,
                "month": MONTHS[month_index],
                "date": f"{month_index + 1}/{day_in_month}",
                "sourceIndex": item["sourceIndex"],
                "quoteZh": item["quoteZh"],
                "quoteEn": item["quoteEn"],
            }
        )

    output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Imported {len(records)} daily entries from {len(items)} Markdown items.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
