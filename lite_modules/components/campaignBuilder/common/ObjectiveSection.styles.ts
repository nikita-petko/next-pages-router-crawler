import { makeStyles } from '@rbx/ui';

const useObjectiveSectionStyles = makeStyles()((theme) => ({
  iconContainer: {
    alignSelf: 'flex-start',
    border: `1px solid ${theme.palette.surface[400]}`,
    display: 'flex',
    flexShrink: 0,
    transform: 'rotate(-15deg)',
  },
  largeIconProperties: {
    height: '60px',
    padding: '8px',
    transform: 'rotate(15deg)',
    width: '60px',
  },
}));

export default useObjectiveSectionStyles;
