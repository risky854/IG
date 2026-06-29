import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ConfirmButton from '../components/ConfirmButton';
import JsonView from '../components/JsonView';
import StatusBanner from '../components/StatusBanner';
import { useEngine } from '../lib/EngineContext';

export default function SettingsScreen() {
  const { call, disconnect, isConnected, serverUrl } = useEngine();

  const [credStatus, setCredStatus] = useState<unknown>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [env, setEnv] = useState<'demo' | 'production'>('demo');
  const [apiKey, setApiKey] = useState('');
  const [rsaPem, setRsaPem] = useState('');

  const [rpcMethod, setRpcMethod] = useState('');
  const [rpcParams, setRpcParams] = useState('');
  const [rpcResult, setRpcResult] = useState<unknown>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [rpcBusy, setRpcBusy] = useState(false);

  const disabled = !isConnected || busy;

  const checkStatus = useCallback(async () => {
    setBusy(true);
    setCredError(null);
    try {
      setCredStatus(await call('credentialStatus'));
    } catch (e) {
      setCredError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setBusy(false);
    }
  }, [call]);

  const testCredentials = useCallback(async () => {
    setBusy(true);
    setCredError(null);
    try {
      setCredStatus(await call('testCredentials'));
    } catch (e) {
      setCredError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setBusy(false);
    }
  }, [call]);

  const saveCredentials = useCallback(async () => {
    setBusy(true);
    setCredError(null);
    try {
      setCredStatus(await call('setCredentials', { apiKey, rsaPem, env }));
    } catch (e) {
      setCredError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setBusy(false);
    }
  }, [call, apiKey, rsaPem, env]);

  const clearCredentials = useCallback(async () => {
    setBusy(true);
    setCredError(null);
    try {
      setCredStatus(await call('clearCredentials'));
      setApiKey('');
      setRsaPem('');
    } catch (e) {
      setCredError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setBusy(false);
    }
  }, [call]);

  const sendRawRpc = useCallback(async () => {
    setRpcBusy(true);
    setRpcError(null);
    try {
      let params: unknown;
      if (rpcParams.trim()) {
        params = JSON.parse(rpcParams);
      }
      setRpcResult(await call(rpcMethod.trim(), params));
    } catch (e) {
      setRpcError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setRpcBusy(false);
    }
  }, [call, rpcMethod, rpcParams]);

  return (
    <ScrollView style={styles.container}>
      <StatusBanner />

      <Text style={styles.sectionTitle}>Connection</Text>
      <Text style={styles.value}>{serverUrl ?? '—'}</Text>
      <View style={styles.row}>
        <ConfirmButton
          title="Disconnect"
          message="This forgets your saved gateway URL and token on this device. You'll need to re-enter them to reconnect."
          onConfirm={disconnect}
        />
      </View>

      <Text style={styles.sectionTitle}>Kalshi credentials</Text>
      <Text style={styles.hint}>
        Credentials are sent to your own gateway only. Field names below are best-effort — confirm
        them against your engine's actual `setCredentials` handler before relying on this form.
      </Text>
      {credError ? <Text style={styles.error}>{credError}</Text> : null}

      <View style={styles.row}>
        <ConfirmButton title="Check status" message="Fetch current credential status from the engine." onConfirm={checkStatus} disabled={disabled} />
      </View>
      <View style={styles.row}>
        <ConfirmButton title="Test credentials" message="Ask the engine to verify the stored credentials against Kalshi." onConfirm={testCredentials} disabled={disabled} />
      </View>

      <Text style={styles.label}>Environment</Text>
      <View style={styles.envRow}>
        <ConfirmButton
          title={env === 'demo' ? '● Demo' : 'Demo'}
          message="Switch the credentials form to target the Kalshi demo environment."
          onConfirm={() => setEnv('demo')}
        />
        <ConfirmButton
          title={env === 'production' ? '● Production' : 'Production'}
          message="Switch the credentials form to target the Kalshi production environment. Real money is at risk once these credentials are saved and trading resumes."
          color="#c0392b"
          onConfirm={() => setEnv('production')}
        />
      </View>

      <Text style={styles.label}>API key</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Kalshi API key ID"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>RSA private key (PEM)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        value={rsaPem}
        onChangeText={setRsaPem}
        placeholder="-----BEGIN RSA PRIVATE KEY-----"
        placeholderTextColor="#666"
      />

      <View style={styles.row}>
        <ConfirmButton
          title="Save credentials"
          message={`This sends the API key and private key above to your gateway and stores them as ${env} credentials. Are you sure?`}
          color="#c0392b"
          onConfirm={saveCredentials}
          disabled={disabled || !apiKey || !rsaPem}
        />
      </View>
      <View style={styles.row}>
        <ConfirmButton
          title="Clear stored credentials"
          message="This removes the credentials currently stored on the engine. Are you sure?"
          color="#c0392b"
          onConfirm={clearCredentials}
          disabled={disabled}
        />
      </View>

      <Text style={styles.sectionTitle}>Credential status</Text>
      <JsonView data={credStatus} />

      <Text style={styles.sectionTitle}>Advanced: raw RPC</Text>
      <Text style={styles.hint}>
        Call any engine method directly, e.g. for `setConfig`, `crypto15m`, `runOnce`, or
        `kalshiMarketUrl` whose exact parameter shapes aren't pinned down here.
      </Text>
      {rpcError ? <Text style={styles.error}>{rpcError}</Text> : null}

      <Text style={styles.label}>Method</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        value={rpcMethod}
        onChangeText={setRpcMethod}
        placeholder="e.g. setConfig"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Params (JSON, optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        value={rpcParams}
        onChangeText={setRpcParams}
        placeholder='{"key": "value"}'
        placeholderTextColor="#666"
      />

      <View style={styles.row}>
        <ConfirmButton
          title="Send"
          message={`Call "${rpcMethod || '(empty)'}" on the engine with the params above. Are you sure?`}
          color="#c0392b"
          onConfirm={sendRawRpc}
          disabled={!isConnected || rpcBusy || !rpcMethod.trim()}
        />
      </View>

      <Text style={styles.sectionTitle}>Raw RPC result</Text>
      <JsonView data={rpcResult} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
  value: { color: '#333', marginBottom: 8 },
  hint: { color: '#666', marginBottom: 8 },
  row: { marginBottom: 8 },
  envRow: { flexDirection: 'row', gap: 8 },
  input: { borderColor: '#ccc', borderRadius: 6, borderWidth: 1, padding: 10 },
  multiline: { fontFamily: 'Courier', minHeight: 80, textAlignVertical: 'top' },
  error: { color: '#c0392b', marginBottom: 8 },
});
