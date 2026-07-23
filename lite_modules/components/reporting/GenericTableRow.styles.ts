import { makeStyles } from '@rbx/ui';

import { rowPadding } from '@constants/genericManagementTableStyles';

const useGenericTableRowStyles = makeStyles<void, 'actionMenuButton'>()((theme, _, classes) => ({
  actionMenuButton: {
    marginLeft: 0,
    opacity: 0,
    transition: 'opacity 0.2s linear 0s',
  },

  actionRow: rowPadding,
  buttonAsLink: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    padding: 0,
  },
  campaignTypeRow: rowPadding,
  centerAlignedContentRow: rowPadding,
  centerAlignedStatusRow: rowPadding,
  centerAlignedToggleRow: rowPadding,

  creativeRow: rowPadding,

  creativeThumbnailContainer: {
    '&:focus': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      outline: `2px solid ${theme.palette.primary.main}`,
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'inline-block',
    padding: '4px',
    transition: 'background-color 0.2s',
  },

  creativeThumbnailImage: {
    borderRadius: '8px',
    height: '64px',
    objectFit: 'cover' as const,
    width: '64px',
  },

  fullRow: {
    '&:hover': {
      [`& .${classes.actionMenuButton}`]: {
        opacity: 100,
      },
      // This is the correct color to use, but it is not opaque, which messes with the sticky column.
      backgroundColor: theme.palette.surface[200],
    },
    backgroundColor: theme.palette.content.static.dark,
  },

  gaasNoCreativePlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.palette.content.disabled,
    borderRadius: 8,
    display: 'flex',
    height: 64,
    justifyContent: 'center',
    width: 64,
  },

  nameRow: rowPadding,

  robuxContainer: {
    columnGap: '4px',
    justifyContent: 'flex-end',
  },

  statusRow: rowPadding,

  toggleRow: rowPadding,
  tooltipLinkUnderline: {
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}));

export default useGenericTableRowStyles;
