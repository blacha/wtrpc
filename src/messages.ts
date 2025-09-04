// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Requests<T> = Record<keyof T, (...args: any[]) => Promise<any>>;

export interface WorkerResponseOk<E extends Requests<E>, K extends keyof E = keyof E> {
  id: number;
  type: 'done';
  response: ReturnType<E[K]>;
}

export interface WorkerResponseError {
  id: number;
  type: 'error';
  message: string;
  error: Error;
}

export interface WorkerRequest<E extends Requests<E>, K extends keyof E = keyof E> {
  id: number;
  type: 'request';
  name: K;
  request: Parameters<E[K]>[0];
}
