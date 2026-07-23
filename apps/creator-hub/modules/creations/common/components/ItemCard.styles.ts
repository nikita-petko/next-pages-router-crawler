import { makeStyles } from '@rbx/ui';

const useItemCardStyles = makeStyles()((theme) => ({
  itemCardContainer: {
    height: '100%',
    margin: '0px auto',
  },

  thumbnailContainer: {
    position: 'relative',
    paddingTop: '100%',
  },

  itemCardInfoContainer: {
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '8px',
    '& > *': {
      display: 'flex',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },

  presenceIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },

  itemCardImg: {
    ...theme.border.radius.large,
    position: 'absolute',
    top: 0,
    left: 0,
  },

  itemCardChip: {
    translate: '3px -28px',
    marginBottom: '-26px',
    width: '41px',
    backgroundColor: theme.palette.surface[300],
  },

  itemCardChipSparkle: {
    width: '14px',
    height: '14px',
    marginTop: '2px',
    marginLeft: '2px',
  },

  itemCardChipHash: {
    width: '11px',
    height: '11px',
    translate: '3px -1px',
  },

  itemCardChipWearTimeImg: {
    width: '14px',
    height: '14px',
  },

  itemCardChipWearTime: {
    position: 'absolute',
    top: '5px',
    left: '5px',
    width: '25px',
    height: '25px',
    backgroundColor: theme.palette.surface[300],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default useItemCardStyles;
