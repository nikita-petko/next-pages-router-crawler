export default function getForeshadowTranslationText(
  foreshadowType: unknown,
  foreshadowDuration: unknown,
  translate: (key: string) => string,
) {
  if (
    typeof foreshadowType !== 'string' ||
    (foreshadowType === 'BAN' && typeof foreshadowDuration !== 'number')
  ) {
    return '';
  }
  let foreshadowText = '';
  switch (foreshadowType) {
    case 'WARN':
      foreshadowText = translate('Foreshadow.General');
      break;
    case 'DELETE':
      foreshadowText = translate('Foreshadow.Ban');
      break;
    case 'BAN':
      if (foreshadowDuration === 1) {
        foreshadowText = translate('Foreshadow.1Day');
      } else if (foreshadowDuration === 3) {
        foreshadowText = translate('Foreshadow.3Day');
      } else if (foreshadowDuration === 7) {
        foreshadowText = translate('Foreshadow.7Day');
      }
      break;
    default:
      break;
  }
  return foreshadowText;
}
