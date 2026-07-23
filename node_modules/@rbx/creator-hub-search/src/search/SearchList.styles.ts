import { makeStyles } from '@rbx/ui';

const useSearchListStyles = makeStyles()(() => ({
  sectionTitleContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '0px 16px',
  },
  sectionTitleHasButtonIcon: {
    padding: '0px 16px',
  },
  isClickable: {
    cursor: 'pointer',
  },
  sectionTitle: {
    paddingRight: '2px',
    lineHeight: '30px',
  },
  sectionTitleContainerAllResults: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '0px 8px',
  },
  sectionTitleAllResults: {
    paddingLeft: '2px',
    lineHeight: '30px',
  },
  listContainer: {
    padding: 0,
  },
  chevronButton: {
    padding: '4px',
  },
}));

export default useSearchListStyles;
