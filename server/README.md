# server — gateway

Bridges [Krypt Trader](https://github.com/scripflipped/Krypt-Trader)'s
stdin/stdout JSON-RPC engine (`python/service.py` in that repo) to an
authenticated WebSocket, so the mobile app in `../mobile` can connect to it
remotely. This package contains none of Krypt Trader's trading logic — it
spawns your own checkout of the real `service.py` as a subprocess and relays
its messages unmodified, doing only auth, request-ID bookkeeping (so
multiple mobile clients don't collide), and broadcast of unsolicited engine
events.

## Setup

Requires Python 3.11+ and your own clone of Krypt Trader.

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

- `GATEWAY_TOKEN` — shared secret the mobile app must present. Generate one
  with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`.
- `KRYPT_TRADER_DIR` — path to the `python/` directory of your Krypt Trader
  checkout.
- `KRYPT_SERVICE_CMD` — command used to launch the engine from that
  directory (default `python3 service.py`).
- `GATEWAY_HOST` / `GATEWAY_PORT` — defaults `0.0.0.0:8765`.

## Run

```bash
source .venv/bin/activate
python -m gateway.gateway
```

The gateway restarts the engine subprocess with exponential backoff if it
crashes, and broadcasts a `gateway:engineUp` / `gateway:engineDown` event to
connected clients so the mobile app can show real backend health.

**Run this behind TLS** (a reverse proxy, or a private network like
Tailscale) — a client that completes the auth handshake can place real
trades and call destructive methods like `flatten`, `cancelAllOpen`, and
`shutdown`. Keep `GATEWAY_TOKEN` secret.

## Deploy persistently + reach it from your phone (Tailscale)

To keep the gateway running across reboots and reach it from your phone
without exposing it to the public internet:

1. Install [Tailscale](https://tailscale.com/download) on this server and
   on your phone, and sign both into the same tailnet (`tailscale up` on the
   server; the Tailscale app on the phone).
2. Find this server's tailnet address: `tailscale ip -4`, or use its
   MagicDNS name shown in `tailscale status` (e.g. `neo.your-tailnet.ts.net`).
   Traffic between Tailscale devices is already encrypted (WireGuard), so
   `ws://` (not `wss://`) to that address is fine — you don't need a
   separate TLS cert on top.
3. Install the gateway as a systemd service so it survives reboots and
   restarts itself if it crashes:
   ```bash
   sudo cp krypt-gateway.service.example /etc/systemd/system/krypt-gateway.service
   sudo $EDITOR /etc/systemd/system/krypt-gateway.service   # fix YOUR_USER and the paths
   sudo systemctl daemon-reload
   sudo systemctl enable --now krypt-gateway
   journalctl -u krypt-gateway -f    # confirm it started cleanly
   ```
4. In the mobile app's Connect screen, use `ws://<tailnet-address>:8765` (or
   whatever `GATEWAY_PORT` you set) and your `GATEWAY_TOKEN`.

## Tests

The test suite exercises the gateway against a mock engine fixture
(`tests/fixtures/mock_engine.py`) that speaks the same line-delimited JSON
protocol — it does not reimplement or assert anything about Krypt Trader's
actual trading behavior.

```bash
source .venv/bin/activate
python -m unittest discover -s tests -v
```
