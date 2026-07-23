export interface Deferred<T> extends PromiseLike<T> {
  promise: Promise<T>;
  resolve(value?: T | PromiseLike<T>): void;
  reject(reason?: unknown): void;
}

export default class Defer<T = unknown> implements Deferred<T> {
  public promise: Promise<T>;

  private resolveSelf!: (value: T | PromiseLike<T>) => void;

  private rejectSelf!: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolveSelf = resolve;
      this.rejectSelf = reject;
    });
  }

  resolve(value: T | PromiseLike<T>): void {
    this.resolveSelf(value);
  }

  reject(reason?: unknown): void {
    this.rejectSelf(reason);
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
}
