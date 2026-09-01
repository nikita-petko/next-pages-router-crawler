import { makeStyles } from '@rbx/ui';

type GroupApiKeyInfoBannerStylesProps = {
  headingPaddingBottom: string;
};

const useGroupApiKeyInfoBannerStyles = makeStyles<GroupApiKeyInfoBannerStylesProps>()(
  (theme, { headingPaddingBottom }) => ({
    banner: {
      marginTop: 16,
      marginBottom: 16,
    },
    warningList: {
      listStyleType: 'disc',
      paddingLeft: '20px',
      margin: '0px',
      marginBlockStart: '-5px',
      marginBlockEnd: '0px',
      '& li': {
        margin: '0px',
        padding: '0px',
      },
    },

    warningListItem: {
      display: 'list-item',
      margin: '0px',
      padding: '0px',
      lineHeight: '1.2',
      paddingInlineStart: '0px',
      '& .MuiListItemText-primary': {
        fontSize: '1rem',
      },
    },

    alertTitle: {
      marginTop: '2px',
      paddingBottom: headingPaddingBottom,
      fontSize: '1.125rem',
      fontWeight: 500,
    },
  }),
);

export default useGroupApiKeyInfoBannerStyles;
