"""Bridges the upstream Krypt Trader Python engine (a stdin/stdout JSON-RPC
subprocess, exactly as the original Electron app spawns it) to an
authenticated WebSocket so a remote mobile client can monitor and control it.

This module intentionally contains none of the upstream engine's trading
logic. It only relays bytes: requests in, responses/events out. The engine
itself is launched from wherever you've installed/cloned the real
https://github.com/scripflipped/Krypt-Trader checkout (see server/README.md),
so `git pull` there keeps you on verified upstream code with no fork to
maintain here.

SECURITY: a connection that completes the auth handshake can place real
trades (cancelAllOpen, flatten, setCredentials, etc. all pass straight
through). Always run this behind TLS (a reverse proxy or a private network
like Tailscale) and keep GATEWAY_TOKEN secret.
"""

from __future__ import annotations

import asyncio
import itertools
import logging
import os
import shlex
from typing import Any, Optional

import websockets
from websockets.asyncio.server import ServerConnection, serve

from .protocol import FrameError, decode_line, encode_line, is_response

logger = logging.getLogger("gateway")

AUTH_TIMEOUT_SEC = 10.0
RESTART_BACKOFF_INITIAL_SEC = 1.0
RESTART_BACKOFF_MAX_SEC = 30.0


class EngineProcess:
    """Owns the upstream engine subprocess and the stdin/stdout pump tasks."""

    def __init__(self, command: str, cwd: Optional[str], on_message, on_status):
        self._command = command
        self._cwd = cwd
        self._on_message = on_message
        self._on_status = on_status
        self._proc: Optional[asyncio.subprocess.Process] = None
        self._stop = False
        self._write_lock = asyncio.Lock()

    async def run_forever(self) -> None:
        backoff = RESTART_BACKOFF_INITIAL_SEC
        while not self._stop:
            try:
                await self._spawn_and_pump()
                backoff = RESTART_BACKOFF_INITIAL_SEC
            except Exception:
                logger.exception("engine process failed")
            if self._stop:
                break
            await self._on_status("down")
            logger.warning("engine exited, restarting in %.1fs", backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, RESTART_BACKOFF_MAX_SEC)

    async def _spawn_and_pump(self) -> None:
        logger.info("starting engine: %s", self._command)
        self._proc = await asyncio.create_subprocess_exec(
            *shlex.split(self._command),
            cwd=self._cwd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await self._on_status("up")
        stderr_task = asyncio.create_task(self._pump_stderr())
        try:
            assert self._proc.stdout is not None
            while True:
                line = await self._proc.stdout.readline()
                if not line:
                    break
                try:
                    message = decode_line(line)
                except FrameError as e:
                    logger.warning("dropping malformed engine line: %s", e)
                    continue
                await self._on_message(message)
        finally:
            stderr_task.cancel()
            rc = await self._proc.wait()
            logger.info("engine process exited with code %s", rc)

    async def _pump_stderr(self) -> None:
        assert self._proc is not None and self._proc.stderr is not None
        while True:
            line = await self._proc.stderr.readline()
            if not line:
                return
            logger.info("[engine] %s", line.decode("utf-8", "replace").rstrip())

    async def send(self, message: dict[str, Any]) -> None:
        if self._proc is None or self._proc.stdin is None or self._proc.returncode is not None:
            raise RuntimeError("engine is not running")
        async with self._write_lock:
            self._proc.stdin.write(encode_line(message))
            await self._proc.stdin.drain()

    async def stop(self) -> None:
        self._stop = True
        if self._proc is not None and self._proc.returncode is None:
            self._proc.terminate()


class Gateway:
    def __init__(self, command: str, cwd: Optional[str], token: str):
        self._token = token
        self._engine = EngineProcess(command, cwd, self._on_engine_message, self._on_engine_status)
        self._clients: set[ServerConnection] = set()
        self._pending: dict[int, tuple[ServerConnection, Any]] = {}
        self._ids = itertools.count(1)
        self._engine_up = False

    async def run(self, host: str, port: int) -> None:
        engine_task = asyncio.create_task(self._engine.run_forever())
        async with serve(self._handle_client, host, port, max_size=2**20):
            logger.info("gateway listening on ws://%s:%d", host, port)
            await engine_task

    async def _on_engine_status(self, status: str) -> None:
        self._engine_up = status == "up"
        await self._broadcast({"event": "gateway:engine" + ("Up" if self._engine_up else "Down")})

    async def _on_engine_message(self, message: dict[str, Any]) -> None:
        if is_response(message):
            internal_id = message.get("id")
            entry = self._pending.pop(internal_id, None)
            if entry is None:
                logger.warning("no pending request for engine response id=%r", internal_id)
                return
            client, original_id = entry
            outgoing = dict(message)
            outgoing["id"] = original_id
            await self._send_to(client, outgoing)
        else:
            await self._broadcast(message)

    async def _handle_client(self, ws: ServerConnection) -> None:
        if not await self._authenticate(ws):
            return
        self._clients.add(ws)
        logger.info("client authenticated (%s); %d connected", ws.remote_address, len(self._clients))
        try:
            await self._send_to(ws, {"event": "gateway:engine" + ("Up" if self._engine_up else "Down")})
            async for raw in ws:
                await self._handle_client_message(ws, raw)
        except websockets.ConnectionClosed:
            pass
        finally:
            self._clients.discard(ws)
            for internal_id, (pending_client, _original) in list(self._pending.items()):
                if pending_client is ws:
                    self._pending.pop(internal_id, None)
            logger.info("client disconnected; %d remaining", len(self._clients))

    async def _authenticate(self, ws: ServerConnection) -> bool:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=AUTH_TIMEOUT_SEC)
        except (asyncio.TimeoutError, websockets.ConnectionClosed):
            await ws.close(code=4001, reason="auth timeout")
            return False
        try:
            msg = decode_line(_to_bytes(raw))
        except FrameError:
            await ws.close(code=4000, reason="malformed auth message")
            return False
        if msg.get("type") != "auth" or not _token_matches(msg.get("token"), self._token):
            await ws.close(code=4003, reason="unauthorized")
            return False
        await self._send_to(ws, {"type": "auth_ok"})
        return True

    async def _handle_client_message(self, ws: ServerConnection, raw) -> None:
        try:
            msg = decode_line(_to_bytes(raw))
        except FrameError as e:
            await self._send_to(ws, {"error": {"message": f"malformed request: {e}"}})
            return
        if "method" not in msg:
            await self._send_to(ws, {"id": msg.get("id"), "error": {"message": "missing 'method'"}})
            return
        internal_id = next(self._ids)
        self._pending[internal_id] = (ws, msg.get("id"))
        outgoing = dict(msg)
        outgoing["id"] = internal_id
        try:
            await self._engine.send(outgoing)
        except RuntimeError as e:
            self._pending.pop(internal_id, None)
            await self._send_to(ws, {"id": msg.get("id"), "error": {"message": str(e)}})

    async def _broadcast(self, message: dict[str, Any]) -> None:
        if not self._clients:
            return
        await asyncio.gather(*(self._send_to(c, message) for c in list(self._clients)), return_exceptions=True)

    async def _send_to(self, ws: ServerConnection, message: dict[str, Any]) -> None:
        try:
            await ws.send(encode_line(message).decode("utf-8"))
        except websockets.ConnectionClosed:
            pass

    async def stop(self) -> None:
        await self._engine.stop()


def _to_bytes(raw) -> bytes:
    return raw.encode("utf-8") if isinstance(raw, str) else bytes(raw)


def _token_matches(provided: Any, expected: str) -> bool:
    if not isinstance(provided, str):
        return False
    return len(provided) == len(expected) and all(
        a == b for a, b in zip(provided.encode(), expected.encode())
    ) and len(provided) > 0


def _load_dotenv_if_present() -> None:
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


async def _main() -> None:
    _load_dotenv_if_present()
    logging.basicConfig(level=os.environ.get("GATEWAY_LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    token = os.environ.get("GATEWAY_TOKEN", "")
    if not token:
        raise SystemExit("GATEWAY_TOKEN must be set (generate one with: python -c \"import secrets;print(secrets.token_urlsafe(32))\")")

    command = os.environ.get("KRYPT_SERVICE_CMD", "python3 service.py")
    cwd = os.environ.get("KRYPT_TRADER_DIR")
    if not cwd:
        raise SystemExit("KRYPT_TRADER_DIR must point at the python/ directory of your Krypt-Trader checkout")

    host = os.environ.get("GATEWAY_HOST", "0.0.0.0")
    port = int(os.environ.get("GATEWAY_PORT", "8765"))

    gateway = Gateway(command, cwd, token)
    await gateway.run(host, port)


def main() -> None:
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
