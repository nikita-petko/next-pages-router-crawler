import { makeStyles } from '@rbx/ui';

import { marginUnit, paddingUnit } from '@constants/styleConstants';

const useCardVerificationModalStyles = makeStyles()((theme) => ({
  buttonContainer: {
    marginTop: marginUnit * 2,
    textAlign: 'center',
  },

  incorrectPin: {
    color: theme.palette.content.alert.important,
    display: 'block',
    marginTop: marginUnit * 2,
    textAlign: 'center',
  },

  incorrectPinInput: {
    borderColor: theme.palette.content.alert.important,
    marginLeft: marginUnit * 1.5,
    marginRight: marginUnit * 1.5,
    textAlign: 'center',
    width: '56px',
  },

  linkText: {
    color: theme.palette.content.standard,
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
    borderColor: theme.palette.surface.outline,
    color: theme.palette.content.standard,
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
    color: theme.palette.content.muted,
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
