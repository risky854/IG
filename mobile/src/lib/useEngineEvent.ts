import { useEffect } from 'react';
import { useEngine } from './EngineContext';
import type { RpcMessage } from './rpcClient';

export function useEngineEvent(eventNames: string | string[], handler: (evt: RpcMessage) => void): void {
  const { onEvent, isConnected } = useEngine();
  const names = Array.isArray(eventNames) ? eventNames : [eventNames];

  useEffect(() => {
    const unsubscribe = onEvent((evt) => {
      const name = evt.event as string | undefined;
      if (name && names.includes(name)) handler(evt);
    });
    return unsubscribe;
    // re-subscribe whenever the underlying connection (re)establishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEvent, isConnected]);
}
