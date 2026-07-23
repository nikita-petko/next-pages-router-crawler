export const isRobloxApp = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }
  const userAgent = window.navigator.userAgent ?? '';

  return /RobloxApp\/|ROBLOX\s+\w+\s+App/i.test(userAgent);
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }
  const userAgent = window.navigator.userAgent ?? '';

  const isClassicIOS = /iPhone|iPad|iPod/i.test(userAgent);

  // Check modern iPads pretending to be Macs (has touch capabilities)
  const isModernIPad = /Macintosh/i.test(userAgent) && window.navigator.maxTouchPoints > 1;

  return isClassicIOS || isModernIPad;
};

export const isDesktopSafari = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) {
    return false;
  }
  const userAgent = window.navigator.userAgent ?? '';
  const vendor = window.navigator.vendor ?? '';

  return (
    /apple/i.test(vendor) &&
    /Version\/([0-9._]+).*Safari/i.test(userAgent) &&
    !/crios|fxios|edgios|opera|opt\//i.test(userAgent) &&
    !/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) &&
    !(/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) // Exclude modern iPads
  );
};
