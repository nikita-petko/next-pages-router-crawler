const parseUrl = (url: string): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Workaround until `URL.canParse` is generally available
    const _ = new URL(url);
  } catch {
    return false;
  }
  return true;
};

export default parseUrl;
