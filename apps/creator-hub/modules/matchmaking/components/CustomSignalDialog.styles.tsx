import { makeStyles } from '@rbx/ui';

const useCustomSignalStyles = makeStyles()((theme) => ({
  button: {
    marginRight: 10,
  },
  divider: {
    marginBottom: -15,
  },
  dialogGrid: {
    gap: 15,
  },
  dialogBox: {
    minWidth: 500,
  },
  signalFormContainer: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  typeTitleCard: {
    marginTop: 15,
    marginRight: 15,
    maxWidth: '20%',
  },
  differenceInput: {
    marginLeft: 10,
    marginRight: 10,
  },
  numericalInput: {
    marginRight: 5,
    flex: 1,
  },
  stringInput: {
    marginRight: 5,
    width: '200px',
    flex: 1,
  },
  accordionSummary: {
    marginLeft: -10,
    flexDirection: 'row-reverse',
  },
  gridBorder: {
    border: `1px solid ${theme.palette.components.divider}`,
    borderRadius: 5,
    marginRight: 20,
  },
  inlineCodeContainer: {
    margin: 10,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: `${theme.palette.components.inlineCode}`,
  },
}));

export default useCustomSignalStyles;
