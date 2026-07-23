import { makeStyles } from '@rbx/ui';

const useAdIntegrationAssetsTableStyles = makeStyles()((theme) => ({
  assetNameCell: {
    alignItems: 'center',
    display: 'flex',
    gap: '12px',
    minWidth: 0,
  },
  assetNameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    alignItems: 'center',
    border: `1px solid ${theme.palette.components.divider}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '480px',
    padding: theme.spacing(3),
    textAlign: 'center',
  },
  emptyStateDescription: {
    maxWidth: '640px',
  },
  emptyStateIcon: {
    color: theme.palette.content.standard,
    transform: 'rotate(15deg)',
  },
  emptyStateIconContainer: {
    alignItems: 'center',
    border: `1px solid ${theme.palette.components.divider}`,
    borderRadius: '12px',
    display: 'flex',
    height: '180px',
    justifyContent: 'center',
    marginBottom: theme.spacing(4),
    transform: 'rotate(-15deg)',
    width: '180px',
  },
  emptyStateLink: {
    marginTop: theme.spacing(0.5),
  },
  emptyStateTitle: {
    marginBottom: theme.spacing(1),
  },
  thumbnailContainerImageAndVideo: {
    borderRadius: '4px',
    flexShrink: 0,
    height: '48px',
    margin: '10px 0',
    overflow: 'hidden',
    paddingTop: '0 !important',
    width: '48px',
  },
  thumbnailContainerModel: {
    borderRadius: '4px',
    flexShrink: 0,
    height: '68px',
    overflow: 'hidden',
    paddingTop: '0 !important',
    width: '68px',
  },
  thumbnailImage: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  tooltipLink: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    padding: 0,
    textAlign: 'left' as const,
    textDecoration: 'underline',
  },
}));

export default useAdIntegrationAssetsTableStyles;
