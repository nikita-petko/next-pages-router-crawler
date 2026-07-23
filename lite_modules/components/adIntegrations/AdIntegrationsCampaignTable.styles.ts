import { makeStyles, tooltipClasses } from '@rbx/ui';

const useAdIntegrationsCampaignTableStyles = makeStyles()((theme) => ({
  campaignIdCopyIcon: {
    color: theme.palette.content.inverse,
  },
  campaignIdTooltipContent: {
    alignItems: 'center',
    display: 'flex',
    gap: '4px',
    whiteSpace: 'nowrap',
  },
  campaignIdTooltipPopper: {
    [`& .${tooltipClasses.tooltip}`]: {
      minWidth: 'fit-content',
      padding: '6px 8px',
    },
  },
  campaignLink: {
    color: 'inherit',
    maxWidth: '100%',
    textDecoration: 'none',
  },
  campaignName: {
    '&:hover': {
      textDecoration: 'underline',
    },
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  experienceCell: {
    alignItems: 'center',
    display: 'flex',
    gap: '12px',
    minWidth: 0,
  },
  experienceName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tableContainer: {
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
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  tooltipLink: {
    color: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}));

export default useAdIntegrationsCampaignTableStyles;
