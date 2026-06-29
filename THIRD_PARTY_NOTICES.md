# Third-Party Notices

This repository does not vendor, fork, or redistribute code from any
third-party project. It builds two original pieces — a gateway
(`server/`) and a mobile client (`mobile/`) — designed to run alongside a
separate, unmodified checkout of another project that you install yourself.

## scripflipped/Krypt-Trader

`server/gateway` is designed to spawn and bridge
[`scripflipped/Krypt-Trader`](https://github.com/scripflipped/Krypt-Trader),
an automated trading bot for Kalshi prediction markets, licensed under the
MIT License per its own repository.

- No source code from that project is included, copied, or modified here.
  `server/gateway` treats it as an opaque subprocess: it spawns
  `python/service.py` from your own checkout (path configured via
  `KRYPT_TRADER_DIR` in `server/.env.example`) and relays its existing
  stdin/stdout JSON-RPC protocol over WebSocket, unmodified.
- You are responsible for cloning, installing, and keeping that checkout up
  to date yourself; this repository neither tracks nor pins a version of it.
- Its license terms govern its own code, not this repository's original
  code. See the `LICENSE` file in that repository for the authoritative
  text — it is not reproduced here.
- Its disclaimers about financial risk apply with full force to any
  deployment of this gateway/mobile app, since every control surface here
  (pause, flatten, cancel-all, kill switch, credential management) ultimately
  drives that engine. Refer to its `DISCLAIMER.md` for the authoritative
  text. This project's UI defaults to requiring explicit confirmation for
  destructive actions and never embeds or transmits credentials anywhere
  other than the gateway you host yourself, but it cannot eliminate the risk
  inherent in automated trading with real money.

## This repository's own license

This repository does not currently declare a license for its own original
code (`server/`, `mobile/`, and supporting docs). Add a `LICENSE` file here
if/when one is chosen; until then, no license is granted to that original
code beyond what's implied by its public visibility on GitHub.
