import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfirmButton from '../components/ConfirmButton';
import JsonView from '../components/JsonView';
import StatusBanner from '../components/StatusBanner';
import { useEngine } from '../lib/EngineContext';

export default function ControlsScreen() {
  const { call, isConnected } = useEngine();
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (label: string, method: string, params?: unknown) => {
      setBusy(true);
      setError(null);
      try {
        const result = await call(method, params);
        setLastResult({ action: label, result });
      } catch (e) {
        setError(`${label}: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [call],
  );

  const disabled = !isConnected || busy;

  return (
    <ScrollView style={styles.container}>
      <StatusBanner />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Trading engine</Text>
      <View style={styles.row}>
        <ConfirmButton
          title="Pause / resume"
          message="Toggle the engine's pause state."
          onConfirm={() => run('pause', 'pause')}
          disabled={disabled}
        />
      </View>
      <View style={styles.row}>
        <ConfirmButton
          title="Flatten all positions"
          message="This closes every open position at current market prices. Are you sure?"
          onConfirm={() => run('flatten', 'flatten')}
          color="#c0392b"
          disabled={disabled}
        />
      </View>
      <View style={styles.row}>
        <ConfirmButton
          title="Cancel all open orders"
          message="This cancels every resting order. Are you sure?"
          onConfirm={() => run('cancelAllOpen', 'cancelAllOpen')}
          color="#c0392b"
          disabled={disabled}
        />
      </View>

      <Text style={styles.sectionTitle}>Crypto 15m</Text>
      <View style={styles.row}>
        <ConfirmButton
          title="Check crypto15m status"
          message="Fetch the current crypto 15-minute strategy status."
          onConfirm={() => run('crypto15mStatus', 'crypto15mStatus')}
          disabled={disabled}
        />
      </View>

      <Text style={styles.sectionTitle}>Danger zone</Text>
      <View style={styles.row}>
        <ConfirmButton
          title="Kill switch (shutdown)"
          message="This shuts the engine down entirely. You will need to restart it on your server. Are you absolutely sure?"
          onConfirm={() => run('shutdown', 'shutdown')}
          color="#c0392b"
          disabled={disabled}
        />
      </View>
      <View style={styles.row}>
        <ConfirmButton
          title="Factory reset"
          message="This wipes the engine's local data (trade history, cached state). This cannot be undone. Are you absolutely sure?"
          onConfirm={() => run('factoryReset', 'factoryReset')}
          color="#c0392b"
          disabled={disabled}
        />
      </View>

      <Text style={styles.sectionTitle}>Last result</Text>
      <JsonView data={lastResult} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  row: { marginBottom: 8 },
  error: { color: '#c0392b', marginBottom: 8 },
});
