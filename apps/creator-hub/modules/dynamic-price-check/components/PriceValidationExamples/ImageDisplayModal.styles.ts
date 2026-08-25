import { makeStyles } from '@rbx/ui';

const useImageDisplayModalStyles = makeStyles()(() => ({
  imageContainer: {
    height: '60%',
  },
  croppedImage: {
    width: '100%',
  },
  dialogModal: {
    padding: '0px',
  },
  dialogText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '16px',
    marginTop: '16px',
  },
}));

export default useImageDisplayModalStyles;
