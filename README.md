# IG

A self-hosted mobile companion for [Krypt Trader](https://github.com/scripflipped/Krypt-Trader),
an open-source automated trading bot for [Kalshi](https://kalshi.com) prediction
markets (whale tracker, momentum scanner, automated order placement, risk
controls).

This repo does **not** fork or vendor Krypt Trader. It adds two new pieces
that sit alongside your own checkout of it:

- **`server/`** — a small Python gateway that spawns Krypt Trader's existing
  `python/service.py` as a subprocess and bridges its stdin/stdout JSON-RPC
  protocol over an authenticated WebSocket, so it can be reached from a phone
  instead of only from the desktop Electron app.
- **`mobile/`** — a React Native (Expo) app that talks to that gateway:
  dashboard, signal/scanner views, bot run history, and trading controls
  (pause, flatten, cancel-all, kill switch, factory reset).

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for how this project
relates to Krypt Trader's code and license, and the financial-risk
disclaimers that carry over.

## Repository layout

```
server/   Python gateway: bridges Krypt Trader's stdio protocol to WebSocket
mobile/   Expo React Native app: the mobile client for the gateway
```

Each has its own README with setup details: [`server/README.md`](server/README.md),
[`mobile/README.md`](mobile/README.md).

## Quick start

1. Clone [scripflipped/Krypt-Trader](https://github.com/scripflipped/Krypt-Trader)
   somewhere on the machine that will run the gateway, and install its own
   dependencies per its README.
2. Set up and run the gateway — see [`server/README.md`](server/README.md).
3. Run the mobile app and point it at the gateway's URL/token — see
   [`mobile/README.md`](mobile/README.md).

## Status

Both `server/` and `mobile/` are functional: the gateway has a passing
automated test suite (against a mock engine, since real Kalshi credentials
and a Krypt Trader checkout aren't available in every environment), and the
mobile app has been smoke-tested against that mock gateway. Exact
request/response field names for several engine methods (e.g.
`setCredentials`, account/position shapes) are best-effort and should be
confirmed against your own Krypt Trader checkout — the mobile app falls back
to showing raw JSON rather than guessing at typed UI for anything unverified.
