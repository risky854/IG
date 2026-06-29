import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import StatusBanner from '../components/StatusBanner';
import JsonView from '../components/JsonView';
import { useEngine } from '../lib/EngineContext';
import { useEngineEvent } from '../lib/useEngineEvent';

export default function SignalsScreen() {
  const { call, isConnected } = useEngine();
  const [signals, setSignals] = useState<unknown>(null);
  const [latestSignal, setLatestSignal] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setRefreshing(true);
    try {
      setSignals(await call('signals'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setRefreshing(false);
    }
  }, [call, isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEngineEvent('signal:new', (evt) => {
    setLatestSignal(evt.data ?? evt);
    refresh();
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <StatusBanner />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Latest whale/momentum signal</Text>
      <JsonView data={latestSignal} />

      <Text style={styles.sectionTitle}>All signals</Text>
      <JsonView data={signals} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  error: { color: '#c0392b', marginBottom: 8 },
});
