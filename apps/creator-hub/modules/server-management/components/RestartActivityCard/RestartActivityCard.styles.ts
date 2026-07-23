import { makeStyles } from '@rbx/ui';

const useRestartActivityCardStyles = makeStyles()((theme) => ({
  table: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: 0,
    paddingLeft: theme.spacing(2),
  },
  tableV2: {
    marginTop: theme.spacing(3),
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: theme.spacing(2),
  },
  tableContainerV2: {
    overflowX: 'auto',
  },
  tableElement: {
    '& tbody tr:last-child td': {
      borderBottom: 'none !important',
    },
  },
  emptyState: {
    marginTop: theme.spacing(2),
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  statusChip: {
    backgroundColor: theme.palette.surface[300],
    color: theme.palette.content.standard,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minWidth: theme.spacing(12),
    maxWidth: theme.spacing(16),
  },
  statusIndicator: {
    width: theme.spacing(1),
    height: theme.spacing(1),
    borderRadius: '50%',
  },
  statusIndicatorCompleted: {
    backgroundColor: theme.palette.actionV2.active.fill,
  },
  statusIndicatorInProgress: {
    backgroundColor: theme.palette.actionV2.notice.fill,
  },
  statusIndicatorUnknown: {
    backgroundColor: theme.palette.content.disabled,
  },
  placesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  placeItem: {
    fontSize: theme.typography.body2.fontSize,
    lineHeight: 1.4,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  moreButton: {
    marginLeft: theme.spacing(0.5),
    height: 'auto',
    minHeight: 'auto',
    padding: 0,
    verticalAlign: 'baseline',
  },
  chevronColumn: {
    width: theme.spacing(6),
    padding: theme.spacing(1),
  },
  chevronButton: {
    padding: theme.spacing(0.5),
    color: theme.palette.states.active,
    '&:hover': {
      backgroundColor: theme.palette.surface[200],
    },
  },
  expandedRow: {
    '& td': {
      borderTop: 'none !important',
    },
  },
  mainRowWithExpanded: {
    '& td': {
      borderBottom: 'none !important',
    },
  },
  expandedContent: {
    padding: 0,
    borderTop: 'none !important',
  },
  expandedContentContainer: {
    paddingTop: theme.spacing(0),
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    paddingBottom: theme.spacing(3),
  },
  detailCard: {
    flex: `1 1 ${theme.spacing(37.5)}`,
    minWidth: theme.spacing(37.5),
    padding: theme.spacing(2),
  },
}));

export default useRestartActivityCardStyles;
