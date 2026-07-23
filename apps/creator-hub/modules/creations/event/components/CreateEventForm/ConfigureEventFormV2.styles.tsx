import { makeStyles } from '@rbx/ui';

const useConfigureEventFormV2Styles = makeStyles()((theme) => ({
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '50px',
    [theme.breakpoints.down('Medium')]: {
      marginTop: '24px',
      width: '100%',
      gap: '12px',
      flexDirection: 'column',
    },
  },
  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
  },
  inputsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
    width: '600px',
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
      gap: '24px',
    },
  },
  universeSelectorContainer: {
    alignContent: 'center',
    marginRight: 24,
  },
  descriptionContainer: {
    width: '100%',
  },
  menuItemSubtitle: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '14px',
  },
}));

export default useConfigureEventFormV2Styles;
