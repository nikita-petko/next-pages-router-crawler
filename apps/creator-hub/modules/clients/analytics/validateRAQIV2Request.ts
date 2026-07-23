// NOTE(shumingxu, 2024-12-02): Is this still used / handled by gateway?
export default class NoDataAvailableError extends Error {
  constructor(msg: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NoDataAvailableError.prototype);
  }
}
