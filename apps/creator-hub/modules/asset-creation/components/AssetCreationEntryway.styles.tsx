import { makeStyles, alpha } from '@rbx/ui';

const useAssetCreationEntrywayStyles = makeStyles()((theme) => ({
  createAssetZone: {
    height: 280,
    width: '100%',
    border: `1px dashed ${theme.palette.components.divider}`,
    ...theme.border.radius.medium,
    '& > *': {
      marginBottom: 8,
    },
    paddingTop: `8px`,
    paddingBottom: `8px`,
  },

  createAssetZoneEmpty: {
    maxWidth: 800,
    marginTop: -40,
  },

  createAssetZoneDragOver: {
    background: theme.palette.surface[300],
    border: `1px dashed ${theme.palette.surface.outline}`,
  },

  createAssetZoneDragOverError: {
    background: alpha(theme.palette.content.alert.important, 20),
    border: `1px dashed ${theme.palette.content.alert.important}`,
  },

  createAssetTextError: {
    color: theme.palette.content.alert.important,
  },
}));

export default useAssetCreationEntrywayStyles;
