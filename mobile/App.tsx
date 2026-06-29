import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EngineProvider } from './src/lib/EngineContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <EngineProvider>
        <RootNavigator />
      </EngineProvider>
    </SafeAreaProvider>
  );
}
