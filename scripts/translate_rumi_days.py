#!/usr/bin/env python3
import json
import os
import urllib.error
import urllib.request
from pathlib import Path


DATA_PATH = Path("data/rumi-days.json")
BATCH_SIZE = 12
MODEL = os.environ.get("RUMI_TRANSLATION_MODEL", "gpt-4o-mini")
API_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/") + "/chat/completions"


def system_prompt():
    return (
        "You are translating Rumi-inspired English daily readings into elegant Simplified Chinese. "
        "Translate faithfully but poetically for contemplative spiritual reading. "
        "Preserve line breaks when they matter. Avoid stiff literal translation. "
        "Do not add commentary. Return only valid JSON."
    )


def translate_batch(batch):
    payload = [
        {
            "id": item["id"],
            "type": item["type"],
            "month": item.get("month"),
            "weekday": item.get("weekday"),
            "quoteEn": item["quoteEn"],
        }
        for item in batch
    ]
    body = {
        "model": MODEL,
        "temperature": 0.35,
        "messages": [
            {"role": "system", "content": system_prompt()},
            {
                "role": "user",
                "content": (
                    "Translate quoteEn into quoteZh for each object. "
                    "Return a JSON array with objects {id, quoteZh}.\n\n"
                    + json.dumps(payload, ensure_ascii=False)
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI HTTP {error.code}: {detail[:1000]}") from error
    content = json.loads(raw)["choices"][0]["message"]["content"]
    parsed = json.loads(content)
    if isinstance(parsed, dict):
        for key in ("items", "translations", "data"):
            if isinstance(parsed.get(key), list):
                return parsed[key]
    if isinstance(parsed, list):
        return parsed
    raise ValueError(f"Unexpected response shape: {content[:400]}")


def main():
    records = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    for index, record in enumerate(records):
        record.setdefault("id", f"{record['type']}-{index + 1}")

    pending = [record for record in records if record.get("quoteEn") and not record.get("quoteZh")]
    if not pending:
        print("No translations pending")
        return 0

    for offset in range(0, len(pending), BATCH_SIZE):
        batch = pending[offset : offset + BATCH_SIZE]
        translations = translate_batch(batch)
        by_id = {item["id"]: item.get("quoteZh", "").strip() for item in translations}
        for record in batch:
            if by_id.get(record["id"]):
                record["quoteZh"] = by_id[record["id"]]
        DATA_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Translated {min(offset + BATCH_SIZE, len(pending))}/{len(pending)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
