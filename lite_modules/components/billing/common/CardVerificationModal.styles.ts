import { makeStyles } from '@rbx/ui';

import { marginUnit, paddingUnit } from '@constants/styleConstants';

const useCardVerificationModalStyles = makeStyles()(() => ({
  buttonContainer: {
    marginTop: marginUnit * 2,
    textAlign: 'center',
  },

  incorrectPin: {
    color: '#F4645D',
    display: 'block',
    marginTop: marginUnit * 2,
    textAlign: 'center',
  },

  incorrectPinInput: {
    borderColor: '#F4645D',
    marginLeft: marginUnit * 1.5,
    marginRight: marginUnit * 1.5,
    textAlign: 'center',
    width: '56px',
  },

  linkText: {
    color: '#EDEDED',
    fontWeight: 'bold',
  },

  loadingTextContainer: {
    display: 'block',
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  pinInputContainer: {
    justifyContent: 'center',
    marginBottom: marginUnit,
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  progressBarContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    marginTop: '15%',
    width: '100%',
  },

  skipButton: {
    borderColor: '#989898',
    color: '#EDEDED',
    marginRight: marginUnit,
  },

  verifyCardModalCloseButton: {
    float: 'right',
    marginRight: '-12px',
    marginTop: '-6px',
  },

  verifyCardModalContainer: {
    minHeight: '306px',
    paddingBottom: paddingUnit * 3,
    paddingTop: `${paddingUnit * 3}px !important`,
    width: '600px',
  },

  verifyCardModalHeader: {
    alignItems: 'center',
    display: 'block',
    paddingBottom: paddingUnit * 3,
  },

  verifyCardModalHelpText: {
    color: '#CBCBCB',
    display: 'block',
    marginBottom: marginUnit * 3,
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  verifyCardModalText: {
    display: 'block',
    marginBottom: marginUnit * 3,
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  verifyCardModalTextLine1: {
    display: 'block',
    marginBottom: marginUnit * 3,
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  verifyCardModalTextLine2: {
    display: 'inline',
  },

  verifyCardModalTextLinesContainer: {
    textAlign: 'center',
  },

  verifyCardPinInput: {
    marginLeft: marginUnit * 1.5,
    marginRight: marginUnit * 1.5,
    textAlign: 'center',
    width: '56px',
  },
}));
export default useCardVerificationModalStyles;
