import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import StatusBanner from '../components/StatusBanner';
import JsonView from '../components/JsonView';
import { useEngine } from '../lib/EngineContext';

const POLL_INTERVAL_MS = 10000;

export default function ScannerScreen() {
  const { call, isConnected } = useEngine();
  const [stats, setStats] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setRefreshing(true);
    try {
      setStats(await call('scannerStats'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setRefreshing(false);
    }
  }, [call, isConnected]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <StatusBanner />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.sectionTitle}>Momentum scanner stats</Text>
      <JsonView data={stats} />
      <Text style={styles.hint}>Auto-refreshes every {POLL_INTERVAL_MS / 1000}s.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  error: { color: '#c0392b', marginBottom: 8 },
  hint: { color: '#666', fontSize: 12, marginTop: 12 },
});
