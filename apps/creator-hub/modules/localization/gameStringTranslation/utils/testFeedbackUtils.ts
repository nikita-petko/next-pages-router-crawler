function getTranslation(translations: string, defaultString: string): string {
  return translations !== '' ? translations : defaultString;
}

export default getTranslation;
