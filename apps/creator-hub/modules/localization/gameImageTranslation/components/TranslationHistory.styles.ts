import { makeStyles } from '@rbx/ui';

const useTranslationHistoryStyles = makeStyles()((theme) => ({
  thumbnail: {
    maxWidth: '100%',
    maxHeight: 120,
    objectFit: 'contain',
    borderRadius: theme.shape.borderRadius,
  },
}));

export default useTranslationHistoryStyles;
