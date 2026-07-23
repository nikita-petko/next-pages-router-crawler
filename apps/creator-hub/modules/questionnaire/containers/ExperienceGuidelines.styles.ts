import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useExperienceGuidelinesStyles = makeStyles()((theme) => ({
  mainGrid: {
    ...fullWidthHeight,
    maxWidth: '700px',
    marginTop: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
  },

  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
  },

  complianceText: {
    width: '50%',
    marginBottom: theme.spacing(2),
  },

  table: {
    marginBottom: theme.spacing(3),
  },

  cell: {
    width: '50%',
  },

  cellIncreaseMaturity: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  firstColumnHeader: {
    width: '50%',
  },

  tooltip: {
    display: 'flex',
    alignItems: 'center',
  },

  tooltipIcon: {
    marginLeft: '8px',
  },

  boldText: {
    fontWeight: 450,
  },

  unorderedList: {
    margin: `0px`,
  },

  commonTextDiv: {
    marginTop: `24px`,
  },

  guidelinesImpact: {
    marginTop: `16px`,
  },
}));

export default useExperienceGuidelinesStyles;
