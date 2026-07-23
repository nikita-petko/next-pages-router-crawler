import { makeStyles } from '@rbx/ui';

const usePlacesManagementItemCardTitleStyles = (isDisabled: boolean) => {
  return makeStyles()((theme) => ({
    titleGridStyle: {
      height: 44,
      display: 'flex',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    subTitleGridStyle: {
      height: 44,
      marginTop: 4,
      display: 'flex',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    titleTypography: {
      fontWeight: 'bold',
      color: isDisabled ? theme.palette.text.disabled : theme.palette.text.primary,
    },

    subTitleTypography: {
      color: isDisabled ? theme.palette.text.disabled : theme.palette.text.secondary,
      paddingTop: 4,
    },
  }));
};

export default usePlacesManagementItemCardTitleStyles;
