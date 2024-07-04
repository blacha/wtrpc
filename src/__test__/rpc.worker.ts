import { parentPort, threadId } from 'node:worker_threads';

import { WorkerRpc } from '../worker.js';

let workCount = 1;
export type RpcContract = {
  doWork: () => Promise<{ count: number; threadId: number }>;
  error: () => Promise<unknown>;
};

export const worker = new WorkerRpc<RpcContract>({
  async doWork(): Promise<{ count: number; threadId: number }> {
    return { count: workCount++, threadId };
  },
  async error(): Promise<unknown> {
    throw new Error('Some Error');
  },
});

if (parentPort) worker.bind(parentPort);
