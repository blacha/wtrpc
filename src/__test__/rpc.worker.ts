/* eslint-disable @typescript-eslint/require-await */
import { parentPort, threadId } from 'node:worker_threads';

import { WorkerRpc } from '../worker.js';

let workCount = 1;
export interface RpcContractInterface {
  doWork(req: { workId: string }): Promise<{ count: number; threadId: number; workId: string }>;
  error(): Promise<unknown>;
}

export type RpcContractType = {
  doWork: (req: { workId: string }) => Promise<{ count: number; threadId: number; workId: string }>;
  error: () => Promise<unknown>;
};

export const worker = new WorkerRpc<RpcContractInterface>({
  async doWork(req: { workId: string }): Promise<{ count: number; threadId: number; workId: string }> {
    return { count: workCount++, threadId, workId: req.workId };
  },
  async error(): Promise<unknown> {
    throw new Error('Some Error');
  },
});

export const workerType = new WorkerRpc<RpcContractType>({
  async doWork(req: { workId: string }): Promise<{ count: number; threadId: number; workId: string }> {
    return { count: workCount++, threadId, workId: req.workId };
  },
  async error(): Promise<unknown> {
    throw new Error('Some Error');
  },
});

if (parentPort) worker.bind(parentPort);
