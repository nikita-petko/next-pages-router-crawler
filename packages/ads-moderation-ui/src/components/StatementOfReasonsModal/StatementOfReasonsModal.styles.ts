import { makeStyles } from '@rbx/ui';

const useStatementOfReasonsModalStyles = makeStyles()((theme) => ({
  actionsRow: {
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-start',
  },
  bottomTextMargin: {
    marginBottom: theme.spacing(2),
  },
  grayPanel: {
    backgroundColor: theme.palette.surface[400],
    borderRadius: 8,
    padding: '16px',
    [theme.breakpoints.up('Small')]: {
      padding: '24px',
    },
  },
  grayPanelGrid: {
    columnGap: theme.spacing(2),
    display: 'grid',
    gridTemplateColumns: '1fr',
    marginBottom: theme.spacing(2),
    rowGap: theme.spacing(2.5),
    [theme.breakpoints.up('Small')]: {
      gridTemplateColumns: 'max-content 1fr',
    },
  },
  imageRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(2),
  },
  imageWrapper: {
    height: 240,
    maxWidth: '100%',
    paddingTop: '0 !important',
    position: 'relative',
    width: 240,
  },
  infoGrid: {
    columnGap: theme.spacing(2),
    display: 'grid',
    gridTemplateColumns: '1fr',
    rowGap: theme.spacing(1),
    [theme.breakpoints.up('Small')]: {
      gridTemplateColumns: 'max-content 1fr',
    },
  },
  link: {
    color: theme.palette.content.action,
  },
  mutedText: { color: theme.palette.content.muted },
  rootContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: 20,
  },
  standard: {
    color: theme.palette.content.standard,
  },
  standardBold: {
    color: theme.palette.content.standard,
    fontWeight: theme.typography.fontWeightBold,
  },
  thumbnailImage: {
    borderRadius: 8,
    display: 'block',
    height: 'auto',
    width: '100%',
  },
}));

export default useStatementOfReasonsModalStyles;
