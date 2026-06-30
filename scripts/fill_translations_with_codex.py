#!/usr/bin/env python3
import json
import re
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "rumi-days.json"
CHUNK_SIZE = 16


PROMPT = """你是鲁米诗歌与苏菲灵修文本的中文译者。
请将 stdin 中 JSON 数组每项 quoteEn 翻译为简体中文 quoteZh。

要求：
- 忠于原意，但中文要传神达意、自然、优美、可朗读。
- 保留诗歌中重要换行。
- 不要添加解释、注释、标题或英文。
- 宗教/灵修语境要庄重温柔，避免机器腔。
- 只输出 JSON 数组，每项只包含 id 和 quoteZh。
"""


def ensure_ids(records):
    changed = False
    for index, record in enumerate(records, start=1):
        if not record.get("id"):
            if record.get("type") == "day":
                record["id"] = f"day-{record.get('day', index)}"
            elif record.get("type") == "month":
                record["id"] = f"month-{record.get('monthIndex', index)}"
            else:
                record["id"] = f"record-{index}"
            changed = True
    return changed


def extract_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"No JSON array found: {text[:500]}")
    return json.loads(text[start : end + 1])


def translate_chunk(chunk):
    payload = json.dumps(
        [{"id": item["id"], "quoteEn": item["quoteEn"]} for item in chunk],
        ensure_ascii=False,
        indent=2,
    )
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", suffix=".json", delete=False) as out:
        out_path = Path(out.name)
    try:
        result = subprocess.run(
            [
                "codex",
                "exec",
                "--cd",
                str(ROOT),
                "--sandbox",
                "read-only",
                "--output-last-message",
                str(out_path),
                PROMPT,
            ],
            input=payload,
            text=True,
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=300,
            check=False,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stdout[-4000:])
        return extract_json(out_path.read_text(encoding="utf-8"))
    finally:
        out_path.unlink(missing_ok=True)


def main():
    records = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    changed = ensure_ids(records)
    if changed:
        DATA_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    pending = [record for record in records if record.get("quoteEn") and not record.get("quoteZh")]
    print(f"Pending: {len(pending)}")
    for offset in range(0, len(pending), CHUNK_SIZE):
        chunk = pending[offset : offset + CHUNK_SIZE]
        translations = translate_chunk(chunk)
        by_id = {item["id"]: item.get("quoteZh", "").strip() for item in translations}
        missing = [item["id"] for item in chunk if not by_id.get(item["id"])]
        if missing:
            raise RuntimeError(f"Missing translations for: {missing}")
        for record in records:
            if record.get("id") in by_id:
                record["quoteZh"] = by_id[record["id"]]
        DATA_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Translated {min(offset + CHUNK_SIZE, len(pending))}/{len(pending)}")


if __name__ == "__main__":
    main()
