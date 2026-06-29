export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type RpcMessage = Record<string, unknown>;

type PendingEntry = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

const MAX_RECONNECT_DELAY_MS = 15000;

/**
 * Minimal JSON-RPC-over-WebSocket client matching the gateway's framing:
 * an `{type:"auth", token}` handshake, then `{id, method, params}` requests
 * answered by `{id, result}` / `{id, error}`, plus unsolicited `{event, ...}`
 * pushes. Exact method/param shapes are whatever your engine exposes.
 */
export class RpcClient {
  private ws: WebSocket | null = null;
  private pending = new Map<number, PendingEntry>();
  private nextId = 1;
  private eventListeners = new Set<(evt: RpcMessage) => void>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempt = 0;
  private shouldReconnect = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authedOk = false;

  constructor(private url: string, private token: string) {}

  connect(): void {
    this.shouldReconnect = true;
    this.open();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onEvent(fn: (evt: RpcMessage) => void): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  onStatus(fn: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  call<T = unknown>(method: string, params?: unknown, timeoutMs = 15000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.status !== 'connected') {
        reject(new Error('not connected'));
        return;
      }
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`timed out waiting for response to "${method}"`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value as T);
        },
        reject: (reason) => {
          clearTimeout(timer);
          reject(reason);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  private open(): void {
    this.authedOk = false;
    this.setStatus('connecting');
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: this.token }));
    };

    ws.onmessage = (event: { data: unknown }) => {
      let msg: RpcMessage;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (!this.authedOk) {
        if (msg.type === 'auth_ok') {
          this.authedOk = true;
          this.reconnectAttempt = 0;
          this.setStatus('connected');
        }
        return;
      }

      if (msg.id !== undefined && msg.id !== null) {
        const entry = this.pending.get(msg.id as number);
        if (!entry) return;
        this.pending.delete(msg.id as number);
        if ('error' in msg && msg.error) entry.reject(msg.error);
        else entry.resolve(msg.result);
        return;
      }

      this.eventListeners.forEach((fn) => fn(msg));
    };

    ws.onclose = () => {
      this.ws = null;
      this.setStatus('disconnected');
      this.pending.forEach((entry) => entry.reject(new Error('connection closed')));
      this.pending.clear();
      if (this.shouldReconnect) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }
}
