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

## TradingView

`mobile`'s Chart screen embeds TradingView's freely-embeddable "Advanced
Real-Time Chart" widget (loaded at runtime from `https://s3.tradingview.com/tv.js`)
to show a reference price chart for the asset behind a Kalshi market (e.g.
the BTC price a `crypto15m` contract tracks) — Kalshi's own contract
tickers aren't on TradingView's symbol list, so this is not a literal
Kalshi-market chart.

- This is a separate third-party/CDN touchpoint from the Krypt-Trader
  relationship above: a device running the mobile app loads TradingView's
  script directly from TradingView's own servers when the Chart tab is used.
- No Kalshi account data, credentials, positions, or Krypt-Trader data are
  sent to TradingView. The only input is the symbol/interval text the user
  types into the Chart screen (e.g. `BINANCE:BTCUSDT`, `15`).
- TradingView's own terms of use govern that widget; this repository does
  not vendor or modify its code, only loads it via a standard `<script>` tag
  inside a `WebView`.

## Expo Application Services (EAS Build)

`mobile/eas.json` configures [EAS Build](https://docs.expo.dev/build/introduction/),
an optional, opt-in path for compiling a standalone, code-signed iOS (or
Android) app instead of using Expo Go. This is a different kind of
third-party touchpoint than TradingView above: if you use it, Expo's cloud
build service compiles your app on their infrastructure, and — unless you
choose to manage credentials fully locally via a Mac/Xcode build instead —
your Apple Developer signing certificate and/or provisioning profile are
uploaded to Expo's servers (or auto-generated there on your behalf) to sign
the resulting `.ipa`.

- This is entirely optional. `npx expo start` + Expo Go requires no Expo
  account, no EAS, and no certificate upload.
- No Kalshi/Krypt-Trader data or gateway credentials are involved in a
  build — EAS only ever sees your app's source code and signing credentials,
  never your trading account.
- See `mobile/README.md`'s "Building a real iOS app" section for the
  commands, and [Expo's EAS credentials docs](https://docs.expo.dev/app-signing/app-credentials/)
  for exactly what's stored where.

## This repository's own license

This repository does not currently declare a license for its own original
code (`server/`, `mobile/`, and supporting docs). Add a `LICENSE` file here
if/when one is chosen; until then, no license is granted to that original
code beyond what's implied by its public visibility on GitHub.
