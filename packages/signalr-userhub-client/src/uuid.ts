/**
 * Generate a UUID v4 string.
 *
 * We use a manual implementation instead of `crypto.randomUUID()` because:
 * 1. `crypto.randomUUID()` is not available in jsdom (Jest's default test environment)
 * 2. This avoids the need to mock `crypto` in every test file that uses this package
 * 3. Maintains compatibility across different browser and Node.js environments
 *
 * The implementation follows the UUID v4 specification (random with version/variant bits set).
 */
const generateUUID = (): string => {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    // eslint-disable-next-line no-bitwise
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
};
export default generateUUID;
