import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import StatusBanner from '../components/StatusBanner';
import JsonView from '../components/JsonView';
import { useEngine } from '../lib/EngineContext';
import { useEngineEvent } from '../lib/useEngineEvent';

export default function DashboardScreen() {
  const { call, isConnected } = useEngine();
  const [account, setAccount] = useState<unknown>(null);
  const [positions, setPositions] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isConnected) return;
    setRefreshing(true);
    try {
      const [acct, pos] = await Promise.all([call('account'), call('positions')]);
      setAccount(acct);
      setPositions(pos);
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

  useEngineEvent('account:update', (evt) => setAccount(evt.data ?? evt));
  useEngineEvent(['position:new', 'position:update'], () => refresh());

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <StatusBanner />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Account</Text>
      <JsonView data={account} />

      <Text style={styles.sectionTitle}>Positions</Text>
      <JsonView data={positions} />

      <Text style={styles.hint}>
        Raw engine responses — once you've confirmed your engine's exact field names, swap these
        for formatted views.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  error: { color: '#c0392b', marginBottom: 8 },
  hint: { color: '#666', fontSize: 12, marginTop: 16 },
});
