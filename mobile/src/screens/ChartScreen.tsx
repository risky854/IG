import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ConfirmButton from '../components/ConfirmButton';

const DEFAULT_SYMBOL = 'BINANCE:BTCUSDT';
const DEFAULT_INTERVAL = '15';

function widgetHtml(symbol: string, interval: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0d1117; }
      #tv_chart_container { height: 100%; }
    </style>
  </head>
  <body>
    <div id="tv_chart_container"></div>
    <script src="https://s3.tradingview.com/tv.js"></script>
    <script>
      new TradingView.widget({
        autosize: true,
        symbol: ${JSON.stringify(symbol)},
        interval: ${JSON.stringify(interval)},
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0d1117",
        enable_publishing: false,
        save_image: false,
        container_id: "tv_chart_container"
      });
    </script>
  </body>
</html>`;
}

export default function ChartScreen() {
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [loadedSymbol, setLoadedSymbol] = useState(DEFAULT_SYMBOL);
  const [interval, setIntervalValue] = useState(DEFAULT_INTERVAL);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.hint}>
        Reference chart from TradingView for the asset behind a Kalshi market (e.g. the BTC price a
        crypto15m contract tracks) — not a Kalshi-native chart, since Kalshi tickers aren't on
        TradingView's symbol list.
      </Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.symbolInput]}
          autoCapitalize="characters"
          autoCorrect={false}
          value={symbolInput}
          onChangeText={setSymbolInput}
          placeholder="BINANCE:BTCUSDT"
          placeholderTextColor="#666"
        />
        <TextInput
          style={[styles.input, styles.intervalInput]}
          autoCapitalize="none"
          autoCorrect={false}
          value={interval}
          onChangeText={setIntervalValue}
          placeholder="15"
          placeholderTextColor="#666"
        />
      </View>
      <View style={styles.row}>
        <ConfirmButton
          title="Load chart"
          message={`Load a TradingView chart for "${symbolInput.trim() || DEFAULT_SYMBOL}" at interval "${interval.trim() || DEFAULT_INTERVAL}"?`}
          onConfirm={() => setLoadedSymbol(symbolInput.trim() || DEFAULT_SYMBOL)}
        />
      </View>

      <View style={styles.chartWrap}>
        <WebView
          key={`${loadedSymbol}:${interval}`}
          originWhitelist={['*']}
          source={{ html: widgetHtml(loadedSymbol, interval.trim() || DEFAULT_INTERVAL) }}
          javaScriptEnabled
          style={styles.webview}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hint: { color: '#666', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { borderColor: '#ccc', borderRadius: 6, borderWidth: 1, padding: 10 },
  symbolInput: { flex: 2 },
  intervalInput: { flex: 1 },
  chartWrap: { flex: 1, marginTop: 8, overflow: 'hidden', borderRadius: 6 },
  webview: { flex: 1, backgroundColor: '#0d1117' },
});
