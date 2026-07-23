import { makeStyles } from '@rbx/ui';

const useAccountFormStyles = makeStyles()(() => ({
  accountSummaryWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    minHeight: '100%',
    paddingY: 24,
  },
  nameGrid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  nameWrapper: {
    flex: 1,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    width: '50%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    minWidth: '320px',
    width: '30%',
  },
  sectionWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  setupFormColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  setupFormWrapper: {
    maxWidth: 720,
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: '900px',
  },
}));

export default useAccountFormStyles;
