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

## Building a real iOS app (EAS Build)

`npx expo start` + Expo Go is the fastest way to try the app, but Expo Go
doesn't let you sign with your own Apple Developer certificate or install a
standalone app icon on your home screen. For that, build a real `.ipa` via
[EAS Build](https://docs.expo.dev/build/introduction/) (Expo's cloud build
service — see the note in `THIRD_PARTY_NOTICES.md`):

```bash
npm install -g eas-cli
eas login                                   # your own Expo account
```

Edit `app.json`'s `expo.ios.bundleIdentifier` (currently a placeholder,
`com.example.kryptmobile`) to match the App ID tied to your existing
certificate/provisioning profile, then either let EAS generate iOS
credentials for you on first build, or upload your own via:

```bash
eas credentials   # choose iOS, then "Add new" to upload your .p12 + provisioning profile
```

Then build:

```bash
eas build --platform ios --profile preview   # ad-hoc, installs straight to your device
```

This registers your device's UDID (EAS will prompt/guide you) and gives you
an install link when the cloud build finishes. Use the `production` profile
instead if you want to submit to TestFlight/App Store via `eas submit`.

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
