import { makeStyles } from '@rbx/ui';

const UseAddUsersToBanContainerStyles = makeStyles()((theme) => ({
  rootContainer: {
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  pageContainer: {
    maxWidth: '600px',
  },
  headerTitle: {
    paddingBottom: 16,
  },
  sectionContainer: {
    paddingBottom: 36,
  },
  sectionTitle: {
    paddingBottom: 14,
  },
  descriptionText: {
    paddingBottom: 12,
  },
  userInput: {
    paddingBottom: 12,
  },
  checkboxContainer: {
    paddingTop: 20,
  },
  durationUnitsContainer: {
    marginRight: 10,
  },
  radioLabelContainer: {
    marginTop: 10,
  },
  radioLabels: {
    whiteSpace: 'nowrap',
    paddingRight: 10,
  },
  button: {
    marginRight: 10,
  },
}));

export default UseAddUsersToBanContainerStyles;
