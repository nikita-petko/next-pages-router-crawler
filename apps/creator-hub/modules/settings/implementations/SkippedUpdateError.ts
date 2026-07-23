export default class SkippedUpdateError extends Error {
  constructor() {
    super();

    // effectively setting the name to the name of this class
    this.name = this.constructor.name;
  }
}
