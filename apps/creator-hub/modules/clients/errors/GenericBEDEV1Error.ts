export default class GenericBEDEV1Error extends Error {
  constructor(
    public code: number,
    public message: string = '',
  ) {
    super('Generic BEDEV1 Error');
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericBEDEV1Error);
    }
  }
}
