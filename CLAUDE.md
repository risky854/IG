# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this is

A self-hosted mobile companion app for
[Krypt Trader](https://github.com/scripflipped/Krypt-Trader), an
MIT-licensed, open-source automated trading bot for Kalshi prediction
markets (whale tracker, momentum scanner, automated order placement, risk
controls). This repo does not fork or vendor Krypt Trader — it adds a
gateway and a mobile client that run alongside a separately-installed,
unmodified checkout of it. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
for the exact relationship and license boundaries.

Backend model: **self-hosted**. The user runs their own Krypt Trader
checkout and the gateway in this repo on a server/machine they control; the
mobile app is a remote client (dashboard, alerts, manual controls, kill
switch), not a hosted multi-tenant service.

## Directory layout

```
server/                Python gateway (asyncio + websockets)
  gateway/
    protocol.py         Line-delimited JSON framing helpers
    gateway.py           EngineProcess (subprocess lifecycle) + Gateway (WS
                          server: auth, request-ID remapping, broadcast)
  tests/
    test_gateway.py       unittest suite
    fixtures/mock_engine.py  Stand-in engine for tests (same stdio protocol,
                              no real trading logic)
  requirements.txt
  .env.example
  README.md

mobile/                 Expo (React Native, TypeScript) app
  src/lib/               RpcClient (WS JSON-RPC client), secureStore
                          (expo-secure-store wrapper), EngineContext (React
                          context for connection state), useEngineEvent
  src/components/        StatusBanner, ConfirmButton, JsonView
  src/screens/           Connect, Dashboard, Signals, Scanner, Chart,
                          Activity, Controls, Settings
  src/navigation/        RootNavigator
  App.tsx, app.json, package.json, tsconfig.json
  README.md

README.md, THIRD_PARTY_NOTICES.md, CLAUDE.md   Root-level docs
```

## Tech stack

- **`server/`**: Python 3.11+, stdlib `asyncio`, `websockets` (modern
  `websockets.asyncio.server` API, not the deprecated `websockets.server`
  one). No web framework, no database. Tests via stdlib `unittest`.
- **`mobile/`**: Expo SDK ~56, React 19, React Native 0.85, TypeScript
  (strict mode). `@react-navigation` (native-stack + bottom-tabs),
  `expo-secure-store`, `expo-notifications`. `react-dom`/`react-native-web`
  are present so the app can also run in a browser (`npm run web`) for quick
  smoke testing in headless environments without device hardware — the
  product targets are iOS and Android. Note: `react-native-web`'s
  `Alert.alert` is an intentional no-op stub upstream, so confirmation
  dialogs (used throughout `Controls`/`Settings`) only actually fire on
  iOS/Android, not in the web preview. `react-native-webview` (used by
  `ChartScreen` to embed a TradingView widget) similarly has no web
  implementation and renders its own "not supported on this platform"
  fallback there — the chart itself only renders on iOS/Android.

## Build / run / test commands

Gateway:
```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m unittest discover -s tests -v   # tests
python -m gateway.gateway                  # run (needs .env, see server/README.md)
```

Mobile:
```bash
cd mobile
npm install
npx tsc --noEmit       # typecheck (no lint config and no automated test
                         # suite yet — don't claim either exists)
npx expo start          # run (device/simulator)
npm run web              # browser preview
```

## External services / credentials

- `server/.env` (git-ignored; copy from `server/.env.example`) holds
  `GATEWAY_TOKEN` (shared secret for the mobile app) and `KRYPT_TRADER_DIR`
  (path to the user's own Krypt Trader checkout). Never commit `.env`.
- Kalshi API credentials (API key + RSA private key) are entered in the
  mobile app's Settings screen and sent only to the user's own gateway,
  which forwards them to the engine subprocess; they are not persisted by
  the gateway itself and never touch a third party.
- The mobile app's `secureStore.ts` persists only the gateway URL/token,
  using `expo-secure-store` (OS keychain/keystore) — not Kalshi credentials.

## Deployment

Not yet defined beyond "run `server/gateway` on a machine you control,
behind TLS (reverse proxy or a private network like Tailscale), and point
the mobile app at it." No CI, container image, or hosting setup exists yet.

## Working conventions

- **Don't fabricate structure.** Only describe files/behavior that actually
  exist; verify with `ls`/`Glob` rather than trusting this file blindly if
  it looks stale.
- **Keep this file in sync with reality.** Update the relevant section above
  whenever you add/remove a meaningful piece of structure.
- **Unverified upstream schemas stay raw.** Several gateway methods'
  request/response shapes (e.g. `setCredentials`, account/position fields)
  are best-effort guesses at Krypt Trader's actual API, since that engine
  isn't vendored here and its source wasn't all verified verbatim. The
  mobile app deliberately renders raw JSON (`JsonView`) for these rather
  than fabricating typed UI — keep that pattern for any new screen touching
  an unconfirmed method, and prefer extending `SettingsScreen`'s raw-RPC
  panel over guessing at a typed form.
- **Safety on destructive actions.** Anything that places/cancels real
  orders, shuts down the engine, or wipes local state must stay behind
  `ConfirmButton`'s confirmation dialog. Don't add a control that bypasses
  it.
- **No premature abstraction.** Don't pre-build for hypothetical future
  features (e.g. multi-tenant hosting, other exchanges) that haven't been
  requested.

## Git workflow

- Default branch: `main`.
- Feature work happens on topic branches (e.g.
  `claude/claude-md-docs-on0u4s`, used for this gateway + mobile app work).
- Commit messages should be clear and describe *why*, not just *what*.
