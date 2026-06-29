import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEngine } from '../lib/EngineContext';

export default function ConnectScreen() {
  const { connect, status } = useEngine();
  const [url, setUrl] = useState('wss://');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await connect(url.trim(), token.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to your gateway</Text>
      <Text style={styles.hint}>
        Your Kalshi credentials are only ever sent to the gateway you host yourself, never to a
        third-party server, and never stored on this device.
      </Text>

      <Text style={styles.label}>Gateway URL</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        value={url}
        onChangeText={setUrl}
        placeholder="wss://your-server:8765"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Access token</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={token}
        onChangeText={setToken}
        placeholder="GATEWAY_TOKEN"
        placeholderTextColor="#666"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {status === 'connecting' ? (
        <ActivityIndicator />
      ) : (
        <Button title="Connect" onPress={onSubmit} disabled={!url || !token} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#666', marginBottom: 24 },
  label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: { borderColor: '#ccc', borderRadius: 6, borderWidth: 1, padding: 10 },
  error: { color: '#c0392b', marginTop: 12 },
});
