#!/usr/bin/env python3
"""Stand-in for the upstream Krypt Trader python/service.py, speaking the
same line-delimited JSON-RPC-over-stdio shape, used only to exercise the
gateway's bridging logic in tests. Not a reimplementation of any trading
behaviour.
"""
import json
import sys


def send(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def main():
    for raw in sys.stdin:
        line = raw.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        method = req.get("method")
        rid = req.get("id")
        if method == "ping":
            send({"id": rid, "result": "pong"})
        elif method == "echo":
            send({"id": rid, "result": req.get("params")})
        elif method == "boom":
            send({"id": rid, "error": {"message": "boom"}})
        elif method == "emitEvent":
            send({"event": "signal:new", "data": req.get("params")})
            send({"id": rid, "result": "ok"})
        else:
            send({"id": rid, "error": {"message": f"unknown method {method}"}})


if __name__ == "__main__":
    main()
