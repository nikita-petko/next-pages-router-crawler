import { makeStyles } from '@rbx/ui';

const useCreatorSettingsAdvancedContainerStyles = makeStyles()((theme) => ({
  betaLabel: {
    alignSelf: 'center',
    height: 20,
    marginLeft: 10,
  },
  grid: {
    maxWidth: '1200px',
    width: 'fit-content',
    rowGap: 48,
  },
  titleRowGap: { rowGap: 28 },
  title2RowGap: { rowGap: 4 },
  accordionTitleGap: { rowGap: 32 },
  editButtonColumnGap: { columnGap: 100 },
  statusLabelColumnGap: { columnGap: 15 },
  buttonGap: { gap: 12 },
  container: {
    [theme.breakpoints.down('Medium')]: {
      margin: 24,
    },
  },
  dialogButton: {
    padding: '0 4px',
  },
  optInBottomSpacing: {
    marginBottom: 48,
  },
}));

export default useCreatorSettingsAdvancedContainerStyles;
