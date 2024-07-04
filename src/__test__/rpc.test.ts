import { describe, it, beforeEach, afterEach } from 'node:test';
import { WorkerRpcPool } from '../pool.js';
import { RpcContract } from './rpc.worker.js';
import assert from 'node:assert/strict';

describe('worker.rpc', () => {
  const workerUrl = new URL('./rpc.worker.js', import.meta.url);

  it('should start workers', async () => {
    const pool = new WorkerRpcPool<RpcContract>(2, workerUrl);
    const [r1, r2] = await Promise.all([pool.run('doWork', undefined), pool.run('doWork', undefined)]);
    assert.equal(r1.threadId, 2);
    assert.equal(r2.threadId, 1);
    await pool.close();
  });

  it('should not hold onto tasks', async () => {
    const pool = new WorkerRpcPool<RpcContract>(2, workerUrl);

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    for (let i = 0; i < 10; i++) {
      await pool.run('doWork', undefined);
    }

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);
    assert.equal(pool.taskId, 10);

    await pool.close();
  });

  it('should not hold onto tasks with errors', async () => {
    const pool = new WorkerRpcPool<RpcContract>(2, workerUrl);

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    for (let i = 0; i < 10; i++) {
      const e = await pool.run('error', undefined).catch((e) => e);
      assert.equal(String(e), 'Error: Some Error');
    }

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    await pool.close();
  });
});
