import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionStatus, RpcClient, RpcMessage } from './rpcClient';
import { clearConnection, loadConnection, saveConnection } from './secureStore';

type EngineContextValue = {
  status: ConnectionStatus;
  isConnected: boolean;
  serverUrl: string | null;
  bootstrapped: boolean;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  call: <T = unknown>(method: string, params?: unknown) => Promise<T>;
  onEvent: (fn: (evt: RpcMessage) => void) => () => void;
};

const EngineContextInner = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<RpcClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const doConnect = useCallback(async (url: string, token: string, persist = true) => {
    clientRef.current?.disconnect();
    const client = new RpcClient(url, token);
    clientRef.current = client;
    client.onStatus(setStatus);
    client.connect();
    setServerUrl(url);
    if (persist) await saveConnection(url, token);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadConnection();
      if (saved && !cancelled) await doConnect(saved.url, saved.token, false);
      if (!cancelled) setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
    };
    // doConnect is stable (empty deps), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = useCallback(async () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setServerUrl(null);
    setStatus('disconnected');
    await clearConnection();
  }, []);

  const call = useCallback(<T,>(method: string, params?: unknown): Promise<T> => {
    if (!clientRef.current) return Promise.reject(new Error('not connected'));
    return clientRef.current.call<T>(method, params);
  }, []);

  const onEvent = useCallback((fn: (evt: RpcMessage) => void) => {
    if (!clientRef.current) return () => {};
    return clientRef.current.onEvent(fn);
  }, []);

  const value = useMemo<EngineContextValue>(
    () => ({
      status,
      isConnected: status === 'connected',
      serverUrl,
      bootstrapped,
      connect: doConnect,
      disconnect,
      call,
      onEvent,
    }),
    [status, serverUrl, bootstrapped, doConnect, disconnect, call, onEvent],
  );

  return <EngineContextInner.Provider value={value}>{children}</EngineContextInner.Provider>;
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContextInner);
  if (!ctx) throw new Error('useEngine must be used within an EngineProvider');
  return ctx;
}
