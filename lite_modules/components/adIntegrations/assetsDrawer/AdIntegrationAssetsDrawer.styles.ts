import { makeStyles } from '@rbx/ui';

const useAdIntegrationAssetsDrawerStyles = makeStyles()((theme) => ({
  addAssetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  campaignIdCopyIcon: {
    fontSize: '14px',
  },
  campaignIdRow: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  campaignInfoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  campaignInfoExperienceName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  campaignInfoExperienceValue: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minWidth: 0,
  },
  campaignInfoGrid: {
    display: 'grid',
    gap: theme.spacing(4),
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  campaignInfoItem: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    minWidth: 0,
  },
  campaignInfoLabel: {
    flexShrink: 0,
    minWidth: '124px',
    whiteSpace: 'nowrap',
  },
  campaignInfoStatusValue: {
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
  },
  campaignInfoValue: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewCard: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    alignItems: 'center',
    border: `1px solid ${theme.palette.components.divider}`,
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    padding: '8px 12px',
  },
  previewCardDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  previewCardText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewCardThumbnail: {
    borderRadius: '4px',
    flexShrink: 0,
    height: '48px',
    overflow: 'hidden',
    paddingTop: '0 !important',
    width: '48px',
  },
  previewCardThumbnailImage: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  table: {
    // `width: 100%` is required so the fixed-layout `<colgroup>` percentages resolve against
    // the drawer width; without it the table shrinks to content and clips on the right.
    tableLayout: 'fixed',
    width: '100%',
  },
  tableColAction: {
    width: '48px',
  },
  tableColAssetId: {
    width: '30%',
  },
  tableColAssetName: {
    width: '40%',
  },
  tableColStatus: {
    width: 'auto',
  },
}));

export default useAdIntegrationAssetsDrawerStyles;
