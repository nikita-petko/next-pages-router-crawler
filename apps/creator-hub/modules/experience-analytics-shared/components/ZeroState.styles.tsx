import { makeStyles } from '@rbx/ui';

const useZeroStateStyles = makeStyles()((theme) => ({
  grid: {
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: '12px',
    padding: '56px',
  },

  descriptionMargin: {
    marginTop: '12px',
  },

  buttonMargin: {
    marginTop: '24px',
  },

  imageMargin: {
    marginTop: '48px',
  },

  imageWidth: {
    maxWidth: '100%',
  },
}));

export default useZeroStateStyles;
