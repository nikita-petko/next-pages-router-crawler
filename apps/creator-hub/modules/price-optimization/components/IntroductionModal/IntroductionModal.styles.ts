import { makeStyles } from '@rbx/ui';

const useIntroductionModalStyles = makeStyles()({
  modalContent: {
    whiteSpace: 'pre-wrap',
  },
  video: {
    height: 'auto',
    width: '100%',
    aspectRatio: '16 / 9',
  },
});

export default useIntroductionModalStyles;
