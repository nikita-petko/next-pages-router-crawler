const convertToRobloxLocale = (localeCode: string | null) => {
  if (localeCode) {
    return localeCode.toLowerCase().replaceAll(/-/g, '_');
  }

  return null;
};

export default convertToRobloxLocale;
