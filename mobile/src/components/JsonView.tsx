import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function JsonView({ data }: { data: unknown }) {
  const text = data === null || data === undefined ? '—' : JSON.stringify(data, null, 2);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text} selectable>
        {text}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0d1117', borderRadius: 6, maxHeight: 220, padding: 8 },
  text: { color: '#c9d1d9', fontFamily: 'Courier', fontSize: 12 },
});
