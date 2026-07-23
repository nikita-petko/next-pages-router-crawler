const convertToRobloxLocale = (localeCode: string | null) => {
  if (localeCode) {
    return localeCode.toLowerCase().replace(/-/g, '_');
  }

  return null;
};

export default convertToRobloxLocale;
