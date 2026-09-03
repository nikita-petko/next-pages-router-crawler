type TranslateFn = (key: string) => string;

type BadUtterance = {
  labelTranslationKey?: string;
};

export function getDevExViolationReason(
  badUtterances: BadUtterance[] | undefined,
  translate: TranslateFn,
): string | undefined {
  if (!badUtterances?.length) {
    return undefined;
  }

  const labels = badUtterances
    .map((utterance) => utterance.labelTranslationKey)
    .filter((key): key is string => Boolean(key))
    .map((key) => translate(key));

  if (labels.length === 0) {
    return undefined;
  }

  return labels.join(', ');
}
