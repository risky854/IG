"""Framing helpers for the line-delimited JSON-RPC protocol spoken by the
upstream Krypt Trader Python engine over stdin/stdout.

The gateway treats any message containing an "id" key as a request/response
that must be correlated with a specific caller, and any message without an
"id" as a one-way event to broadcast to all subscribed clients. This matches
standard JSON-RPC 2.0 semantics (notifications have no "id") and avoids
having to hard-code upstream's exact method/event names.
"""

from __future__ import annotations

import json
from typing import Any


class FrameError(ValueError):
    pass


def encode_line(message: dict[str, Any]) -> bytes:
    return (json.dumps(message, separators=(",", ":")) + "\n").encode("utf-8")


def decode_line(line: bytes) -> dict[str, Any]:
    text = line.decode("utf-8", "replace").strip()
    if not text:
        raise FrameError("empty line")
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise FrameError(f"expected a JSON object, got {type(parsed).__name__}")
    return parsed


def is_response(message: dict[str, Any]) -> bool:
    return "id" in message and message["id"] is not None
