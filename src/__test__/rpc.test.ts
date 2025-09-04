import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { WorkerRpcPool } from '../pool.js';
import { RpcContractInterface, RpcContractType } from './rpc.worker.js';

describe('worker.rpc', () => {
  const workerUrl = new URL('./rpc.worker.js', import.meta.url);

  it('should start workers via interfaces', async () => {
    const pool = new WorkerRpcPool<RpcContractInterface>(2, workerUrl);
    await pool.run('doWork', { workId: 'first' }).finally(() => {
      console.log('done');
    });
    const [r1, r2] = await Promise.all([
      pool.run('doWork', { workId: 'first' }),
      pool.run('doWork', { workId: 'second' }),
    ]);

    assert.equal(r1.workId, 'first');
    assert.equal(r2.workId, 'second');
    assert.notEqual(r1.threadId, r2.threadId);

    // assert.ok(true);
    await pool.close();
  });

  it('should dispose with async using via types', async () => {
    await using pool = new WorkerRpcPool<RpcContractType>(2, workerUrl);
    const [r1, r2] = await Promise.all([
      pool.run('doWork', { workId: 'first' }),
      pool.run('doWork', { workId: 'second' }),
    ]);
    assert.equal(r1.workId, 'first');
    assert.equal(r2.workId, 'second');
    assert.notEqual(r1.threadId, r2.threadId);
  });

  it('should not hold onto tasks', async () => {
    const pool = new WorkerRpcPool<RpcContractInterface>(2, workerUrl);

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    for (let i = 0; i < 10; i++) {
      await pool.run('doWork', { workId: 'first' });
    }

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);
    assert.equal(pool.taskId, 10);

    await pool.close();
  });

  it('should not hold onto tasks with errors', async () => {
    const pool = new WorkerRpcPool<RpcContractInterface>(2, workerUrl);

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    for (let i = 0; i < 10; i++) {
      const e = await pool.run('error', undefined).catch((e: unknown) => e);
      assert.equal(String(e), 'Error: Some Error');
    }

    assert.equal(pool.tasks.size, 0);
    assert.equal(pool.todo.length, 0);

    await pool.close();
  });
});
