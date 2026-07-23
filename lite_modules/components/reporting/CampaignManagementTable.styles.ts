import { makeStyles } from '@rbx/ui';

const useCampaignManagementTableStyles = makeStyles()((theme) => ({
  campaignTable: {
    '&::-webkit-scrollbar': {
      scrollMarginTop: '100px',
      width: '0.4em',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(125,124,125,1)',
      borderRadius: '8px',
      outline: '1px solid slategrey',
    },
    '&::-webkit-scrollbar-track': {
      '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)',
    },
    overflowX: 'auto',
  },

  /**
   * Off-screen wrapper for the campaign-name width probe (see CampaignManagementTable measureRef).
   */
  nameMeasureAnchor: {
    left: -10000,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    visibility: 'hidden',
  },

  /**
   * Must match {@link TableNameCell} name `Typography` (`variant="body2"`), which resolves to the
   * same `theme.typography.body2` tokens. Width measurement then tracks theme font/line-height
   * changes without a duplicate hard-coded size. If the name cell ever uses a different variant,
   * update this spread to the same typography preset.
   */
  nameMeasureText: {
    ...theme.typography.body2,
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
}));

export default useCampaignManagementTableStyles;
