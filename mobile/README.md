# mobile

Expo (React Native, TypeScript) client for the gateway in `../server`. Lets
you monitor and control your own Krypt Trader instance from a phone:
account/positions dashboard, whale/momentum signals, scanner stats, bot run
history, and trading controls (pause, flatten, cancel-all, kill switch,
factory reset).

## Setup

```bash
cd mobile
npm install
```

## Run

```bash
npx expo start        # scan the QR code with Expo Go, or press i/a for a simulator
npm run web            # browser preview
```

On first launch you'll be asked for your gateway's WebSocket URL
(`wss://your-server:8765`) and its `GATEWAY_TOKEN`. These are stored with
`expo-secure-store` (OS keychain/keystore) on iOS/Android; secure storage has
no web backing, so the web preview won't persist them across reloads.

## Structure

```
src/lib/         RpcClient (WebSocket JSON-RPC client), secureStore,
                  EngineContext (connection state via React context)
src/components/   StatusBanner, ConfirmButton, JsonView (shared UI)
src/screens/      Connect, Dashboard, Signals, Scanner, Chart, Activity,
                  Controls, Settings
src/navigation/   RootNavigator (Connect screen vs. tabbed main app)
```

Screens render raw JSON (via `JsonView`) instead of fabricated typed views
for any engine method whose exact response shape hasn't been confirmed
against a real Krypt Trader checkout. `SettingsScreen` includes a free-form
"advanced RPC" panel for calling any engine method directly.

## Typecheck

```bash
npx tsc --noEmit
```

No automated test suite yet — verification so far has been manual/headless
(typecheck + a smoke test against the gateway's mock-engine fixture).
