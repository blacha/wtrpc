import { MessagePort, threadId } from 'node:worker_threads';

import { Requests, WorkerRequest, WorkerResponseError, WorkerResponseOk } from './messages.js';

function isWorkerRequest<E extends Requests<E>>(e: unknown): e is WorkerRequest<E> {
  if (typeof e !== 'object') return false;
  if (e == null) return false;
  if ((e as WorkerRequest<E>).type === 'request') return true;
  return false;
}

export class WorkerRpc<E extends Requests<E>> {
  id = threadId;
  threadId = threadId;
  routes: { [K in keyof E]: E[K] };
  port: MessagePort | null = null;
  isStarted: boolean;
  messageCount = 0;

  constructor(routes: { [K in keyof E]: E[K] }) {
    this.routes = routes;
    this.isStarted = false;
  }

  /** Callback to run when before the first message is processed */
  onStart?: () => Promise<void>;

  async onMessage(e: { id: number }): Promise<WorkerResponseOk<E> | WorkerResponseError> {
    if (!this.isStarted) await this.onStart?.();
    this.messageCount++;
    this.isStarted = true;
    try {
      if (isWorkerRequest<E>(e)) {
        if (this.routes[e.name] != null) {
          const res = (await this.routes[e.name](e.request)) as ReturnType<E[typeof e.name]>;
          return { id: e.id, type: 'done', response: res } as WorkerResponseOk<E>;
        }
      }
      const error = new Error('Unknown Command');
      return { id: e.id, type: 'error', message: String(error), error };
    } catch (error: unknown) {
      return { id: e.id, type: 'error', message: String(error), error: error as Error };
    }
  }

  bind(p: MessagePort): void {
    if (this.port != null) throw new Error('Cannot rebind Worker to new port');
    this.port = p;
    p.on('message', (e: { id: number; name: string }) => {
      this.onMessage(e)
        .then((result) => {
          p.postMessage(result);
        })
        .catch((e: unknown) => {
          throw new Error('Worker message error', { cause: e });
        });
    });
  }
}
