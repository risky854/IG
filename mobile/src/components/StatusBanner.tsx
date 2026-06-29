import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../lib/EngineContext';

export default function StatusBanner() {
  const { status } = useEngine();
  const color = status === 'connected' ? '#1b873f' : status === 'connecting' ? '#b58900' : '#c0392b';
  const label = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected';

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignSelf: 'flex-start', borderRadius: 6, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6 },
  text: { color: '#fff', fontWeight: '600' },
});
